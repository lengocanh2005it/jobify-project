import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Conversation, Message } from 'apps/messages/src/entities';
import { User } from 'apps/users/src/entities';
import { ElasticIndexes, NotificationTypes } from 'libs/common/constants';
import {
  CreateMessagesDto,
  SearchMessagesDto,
  UpdateMessageDto,
} from 'libs/common/dtos';
import { TransactionsProvider } from 'libs/common/providers';
import {
  generateRpcExceptionResponse,
  UrlResponseType,
} from 'libs/common/utils';
import { lastValueFrom } from 'rxjs';
import { In, Repository } from 'typeorm';

@Injectable()
export class MessagesService implements OnModuleInit {
  constructor(
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @Inject('UPLOADS_SERVICE')
    private readonly rabbitMqUploadClient: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
    private readonly transactionsProvider: TransactionsProvider,
    private readonly elasticsearchService: ElasticsearchService,
    @Inject('REDIS_SERVICE') private readonly rabbitMqRedisClient: ClientProxy,
  ) {}

  async onModuleInit() {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const conversationRepository =
        queryRunner.manager.getRepository(Conversation);

      return this.handleSyncAllMessagesToElasticsearch(conversationRepository);
    });
  }

  public handleCreateMessage = async (
    user: User,
    createMessagesDto: CreateMessagesDto,
    file?: Express.Multer.File,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const messageRepository = queryRunner.manager.getRepository(Message);

      const conversationRepository =
        queryRunner.manager.getRepository(Conversation);

      const { id } = user;

      const { receiver_id, content, replied_message_id } = createMessagesDto;

      if (!content && !file)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `You must be provide content of the message.`,
          ),
        );

      const receiver = await lastValueFrom<User>(
        this.rabbitMqUserClient.send({ cmd: 'get-user-jwt' }, receiver_id),
      );

      const sender = await lastValueFrom<User>(
        this.rabbitMqUserClient.send({ cmd: 'get-user-jwt' }, id),
      );

      if (!receiver || !sender)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `User with id '${!receiver ? receiver_id : id}' not found.`,
          ),
        );

      let existingParentMessage: Message | null = null;

      if (replied_message_id) {
        existingParentMessage = await messageRepository.findOne({
          where: { id: replied_message_id },
        });

        if (!existingParentMessage)
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.NOT_FOUND,
              `The message with id: '${replied_message_id}
          that need to be replied not found.'`,
            ),
          );
      }

      let attachmentUrl = '';

      if (file) {
        const [response] = await lastValueFrom<UrlResponseType[]>(
          this.rabbitMqUploadClient.send({ cmd: 'upload-files' }, [file]),
        );

        if (response && response.url) {
          attachmentUrl = response.url;
        }
      }

      let newMessage: Message | null = null;

      if (content) {
        newMessage = messageRepository.create({
          content,
          type: 'text',
          ...(existingParentMessage && {
            repliedMessage: existingParentMessage,
          }),
          sender: { id },
          receiver: { id: receiver_id },
        });

        await messageRepository.save(newMessage);
      }

      let attachmentMessage: Message | null = null;

      if (file && attachmentUrl) {
        attachmentMessage = messageRepository.create({
          ...(existingParentMessage && {
            repliedMessage: existingParentMessage,
          }),
          sender: { id },
          receiver: { id: receiver_id },
          ...(attachmentUrl && { attachment_url: attachmentUrl, type: 'file' }),
        });

        await messageRepository.save(attachmentMessage);
      }

      let existingConversation = await conversationRepository
        .createQueryBuilder('conversation')
        .innerJoin('conversation.participants', 'participant')
        .where('participant.id IN (:...ids)', { ids: [receiver_id, id] })
        .groupBy('conversation.id')
        .having('COUNT(participant.id) = 2')
        .getOne();

      if (!existingConversation) {
        existingConversation = conversationRepository.create({
          participants: [receiver, sender],
          messages:
            attachmentMessage && !newMessage
              ? [attachmentMessage]
              : newMessage && !attachmentMessage
                ? [newMessage]
                : attachmentMessage && newMessage
                  ? [attachmentMessage, newMessage]
                  : [],
        });

        await conversationRepository.save(existingConversation);
      } else {
        existingConversation = (await conversationRepository.findOne({
          where: { id: existingConversation.id },
          relations: [
            'messages',
            'messages.sender',
            'messages.receiver',
            'messages.sender.role',
            'messages.receiver.role',
          ],
        })) as Conversation;
        if (newMessage) {
          existingConversation.messages.push(newMessage);
        }

        if (attachmentMessage) {
          existingConversation.messages.push(attachmentMessage);
        }

        await conversationRepository.save(existingConversation);
      }

      newMessage = (await messageRepository.findOne({
        where: {
          id: newMessage
            ? newMessage.id
            : attachmentMessage
              ? attachmentMessage.id
              : '',
        },
      })) as Message;

      const { title, description, key } = NotificationTypes.NEW_MESSAGE;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
          metadata: {
            conversationId: newMessage.conversation.id,
          },
        },
        userIds: [receiver_id],
      });

      await this.elasticsearchService.index({
        index: ElasticIndexes.CONVERSATIONS,
        id: existingConversation.id,
        body: {
          id: existingConversation.id,
          conversation_nme: existingConversation.conversation_name,
          messages: existingConversation.messages.map((message) => ({
            id: message.id,
            content: message.content,
            is_read: message.is_read,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            read_at: message.read_at,
            type: message.type,
            attachment_url: message.attachment_url,
            conversation: {
              id: existingConversation.id,
              conversation_name: existingConversation.conversation_name,
              sender: {
                id: newMessage.sender.id,
                full_name: newMessage.sender.full_name,
                email: newMessage.sender.email,
                phone_number: newMessage.sender.phone_number,
                role: {
                  name: newMessage.sender.role.name,
                },
              },
              receiver: {
                id: newMessage.receiver.id,
                full_name: newMessage.receiver.full_name,
                email: newMessage.receiver.email,
                phone_number: newMessage.receiver.phone_number,
                role: {
                  name: newMessage.receiver.role.name,
                },
              },
            },
          })),
        },
      });

      this.rabbitMqRedisClient.emit('del-keys-pattern', 'messages');

      return this.elasticsearchService.get({
        index: ElasticIndexes.CONVERSATIONS,
        id: newMessage.id,
      });
    });
  };

  public handleGetMessages = async (user: User) => {
    return this.transactionsProvider.executeTransaction(async () => {
      try {
        const { id } = user;

        const { hits } = await this.elasticsearchService.search<Conversation>({
          index: ElasticIndexes.CONVERSATIONS,
          body: {
            query: {
              match_all: {},
            },
          },
        });

        if (!hits?.hits?.length) return [];

        return hits.hits
          .map((hit) => hit._source)
          .filter((conversation) =>
            conversation?.participants.map((user) => user.id).includes(id),
          )
          .map((conversation) => ({
            ...(conversation?.conversation_name
              ? { conversationName: conversation.conversation_name }
              : { conversationId: conversation?.id }),
            messages: conversation?.messages,
          }));
      } catch (error) {
        if (error?.meta?.statusCode === 404) return [];
        console.error('Elasticsearch search error:', error);
        throw error;
      }
    });
  };

  public handleGetMessageOfConversation = async (
    otherUserId: string,
    user: User,
    searchMessagesDto?: SearchMessagesDto,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const messageRepository = queryRunner.manager.getRepository(Message);

      const otherUser = await lastValueFrom<User>(
        this.rabbitMqUserClient.send({ cmd: 'get-user-jwt' }, otherUserId),
      );

      if (!otherUser)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `User with id: '${otherUserId}' not found.`,
          ),
        );

      const { id } = user;

      const query = messageRepository
        .createQueryBuilder('message')
        .innerJoin('message.conversation', 'conversation')
        .innerJoinAndSelect('message.receiver', 'receiver')
        .innerJoinAndSelect('receiver.role', 'receiver_role')
        .innerJoinAndSelect('message.sender', 'sender')
        .innerJoinAndSelect('sender.role', 'sender_role')
        .innerJoin('conversation.participants', 'participant')
        .where('participant.id IN (:...ids)', { ids: [otherUser.id, id] })
        .andWhere(
          (qb) =>
            `conversation.id IN (${qb
              .subQuery()
              .select('c.id')
              .from('conversation', 'c')
              .innerJoin('c.participants', 'p')
              .where('p.id IN (:...ids)', { ids: [otherUser.id, id] })
              .groupBy('c.id')
              .having('COUNT(DISTINCT p.id) = 2')
              .getQuery()})`,
        )
        .orderBy('message.createdAt', 'DESC')
        .select([
          'message',
          'sender.id',
          'sender.full_name',
          'sender.email',
          'sender.phone_number',
          'sender_role.name',
          'receiver.id',
          'receiver.full_name',
          'receiver.email',
          'receiver.phone_number',
          'receiver_role.name',
        ]);

      if (searchMessagesDto) {
        const from = searchMessagesDto?.from ?? null;

        const to = searchMessagesDto?.to ?? null;

        if (from && to) {
          query.andWhere('message.createdAt BETWEEN :from AND :to', {
            from,
            to,
          });
        } else if (from) {
          query.andWhere('message.createdAt >= :from', { from });
        } else if (to) {
          query.andWhere('message.createdAt <= :to', { to });
        }

        if (searchMessagesDto?.keyword) {
          query.andWhere('LOWER(message.content) LIKE LOWER(:keyword)', {
            keyword: `%${searchMessagesDto.keyword}%`,
          });
        }

        if (searchMessagesDto?.attachment?.toString() === 'true') {
          query.andWhere('message.attachment_url IS NOT NULL');
        }

        if (searchMessagesDto?.sender_id) {
          query.andWhere('message.sender.id = :sender_id', {
            sender_id: searchMessagesDto.sender_id,
          });
        }

        if (searchMessagesDto?.receiver_id) {
          query.andWhere('message.receiver.id = :receiver_id', {
            receiver_id: searchMessagesDto.receiver_id,
          });
        }
      }

      const messages = await query.getMany();

      if (!messages || !messages.length) return [];

      await messageRepository.update(
        { id: In(messages.map((m) => m.id)) },
        { is_read: true, read_at: new Date() },
      );

      return messages;
    });
  };

  public handleDeleteConversation = async (
    user: User,
    conversationId: string,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const conversationRepository =
        queryRunner.manager.getRepository(Conversation);

      const { id } = user;

      const conversation = await conversationRepository.findOne({
        where: {
          id: conversationId,
        },
        relations: ['participants'],
      });

      if (!conversation)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Conversation with id: '${conversationId}' not found.`,
          ),
        );

      if (!conversation.participants.map((pa) => pa.id).includes(id))
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You are only allowed to delete conversations that you are a participant in.`,
          ),
        );

      await this.elasticsearchService.delete({
        index: ElasticIndexes.CONVERSATIONS,
        id: conversationId,
      });

      await conversationRepository.softDelete({ id: conversationId });

      this.rabbitMqRedisClient.emit('del-keys-pattern', 'messages');

      return {
        success: 'Conversation deleted successfully!',
      };
    });
  };

  public handleUpdateMessage = async (
    user: User,
    messageId: string,
    conversationId: string,
    updateMessageDto: UpdateMessageDto,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const conversationRepository =
        queryRunner.manager.getRepository(Conversation);

      const messageRepository = queryRunner.manager.getRepository(Message);

      const { id } = user;

      const { content } = updateMessageDto;

      const message = await messageRepository.findOne({
        where: { id: messageId },
        relations: ['conversation'],
      });

      if (!message)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Message with id: '${messageId}' not found.`,
          ),
        );

      if (message.conversation.id !== conversationId)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can only update messages within the same conversation.`,
          ),
        );

      const conversation = await conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['participants'],
      });

      if (!conversation)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Conversation with id: '${conversationId}' not found.`,
          ),
        );

      if (!conversation.participants.map((pa) => pa.id).includes(id))
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can only update messages in a conversation if you are a participant in that conversation.`,
          ),
        );

      if (message.attachment_url && message.type === 'file')
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            'You can only update text messages.',
          ),
        );

      await messageRepository.update(
        {
          id: messageId,
        },
        {
          content,
        },
      );

      const newMessage = await messageRepository.findOne({
        where: {
          id: messageId,
        },
        relations: [
          'conversation',
          'conversation.participants',
          'conversation.participants.role',
        ],
        select: {
          id: true,
          content: true,
          is_read: true,
          read_at: true,
          type: true,
          attachment_url: true,
          createdAt: true,
          conversation: {
            id: true,
            conversation_name: true,
            participants: {
              id: true,
              full_name: true,
              email: true,
              phone_number: true,
              role: {
                name: true,
              },
            },
          },
        },
      });

      const doc = await this.elasticsearchService.get<Conversation>({
        index: ElasticIndexes.CONVERSATIONS,
        id: message.conversation.id,
      });

      const updatedMessages = doc._source?.messages.map((msg) =>
        msg.id === messageId ? { ...msg, newMessage } : msg,
      );

      await this.elasticsearchService.update({
        index: ElasticIndexes.CONVERSATIONS,
        id: message.conversation.id,
        body: {
          doc: {
            messages: updatedMessages,
          },
        },
      });

      this.rabbitMqRedisClient.emit('del-keys-pattern', 'messages');

      return newMessage;
    });
  };

  public handleDeleteMessage = async (user: User, messageId: string) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const messageRepository = queryRunner.manager.getRepository(Message);

      const { id } = user;

      const message = await messageRepository.findOne({
        where: {
          id: messageId,
        },
        relations: ['conversation', 'conversation.participants'],
      });

      if (!message)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Message with id: '${messageId}' not found.`,
          ),
        );

      if (!message.conversation.participants.map((pa) => pa.id).includes(id))
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can only delete message in a conversation if you are a participant in that conversation.`,
          ),
        );

      const conversation = await this.elasticsearchService.get<Conversation>({
        index: ElasticIndexes.CONVERSATIONS,
        id: message.conversation.id,
      });

      const updatedMessages = conversation._source?.messages.filter(
        (msg) => msg.id !== messageId,
      );

      await this.elasticsearchService.update({
        index: ElasticIndexes.CONVERSATIONS,
        id: message.conversation.id,
        body: {
          doc: {
            messages: updatedMessages,
          },
        },
      });

      this.rabbitMqRedisClient.send('del-keys-pattern', 'messages');

      await messageRepository.softDelete({ id: messageId });

      return {
        success: 'Message deleted successfully!',
      };
    });
  };

  private handleSyncAllMessagesToElasticsearch = async (
    conversationRepository: Repository<Conversation>,
  ) => {
    const conversations = await conversationRepository.find({
      relations: [
        'messages',
        'messages.sender',
        'messages.receiver',
        'messages.sender.role',
        'messages.receiver.role',
      ],
      select: {
        id: true,
        conversation_name: true,
        messages: {
          id: true,
          content: true,
          is_read: true,
          createdAt: true,
          updatedAt: true,
          read_at: true,
          type: true,
          attachment_url: true,
          sender: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            role: {
              name: true,
            },
          },
          receiver: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            role: {
              name: true,
            },
          },
        },
      },
    });

    const bulkBody = conversations.flatMap((conversation) => [
      { index: { _index: ElasticIndexes.CONVERSATIONS, _id: conversation.id } },
      {
        id: conversation.id,
        conversation_name: conversation.conversation_name,
        messages: conversation.messages.map((message) => ({
          ...message,
          sender: this.handleGeneratePickUserInformationDetails(message.sender),
          receiver: this.handleGeneratePickUserInformationDetails(
            message.receiver,
          ),
        })),
      },
    ]);

    if (bulkBody.length > 0) {
      await this.elasticsearchService.bulk({
        index: ElasticIndexes.CONVERSATIONS,
        body: bulkBody,
      });
    }
  };

  private handleGeneratePickUserInformationDetails = (user: User) => {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      role: {
        name: user.role.name,
      },
    };
  };
}

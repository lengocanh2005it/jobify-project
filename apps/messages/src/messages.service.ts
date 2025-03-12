import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from 'apps/messages/src/entities';
import { Message } from 'apps/messages/src/entities';
import { User } from 'apps/users/src/entities';
import { NotificationTypes } from 'libs/common/constants';
import {
  CreateMessagesDto,
  SearchMessagesDto,
  UpdateMessageDto,
} from 'libs/common/dtos';
import {
  generateRpcExceptionResponse,
  UrlResponseType,
} from 'libs/common/utils';
import { lastValueFrom } from 'rxjs';
import { In, Repository } from 'typeorm';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @Inject('UPLOADS_SERVICE')
    private readonly rabbitMqUploadClient: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
  ) {}

  public handleCreateMessage = async (
    user: User,
    createMessagesDto: CreateMessagesDto,
    file?: Express.Multer.File,
  ) => {
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
      existingParentMessage = await this.messageRepository.findOne({
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
      newMessage = this.messageRepository.create({
        content,
        type: 'text',
        ...(existingParentMessage && {
          repliedMessage: existingParentMessage,
        }),
        sender: { id },
        receiver: { id: receiver_id },
      });

      await this.messageRepository.save(newMessage);
    }

    let attachmentMessage: Message | null = null;

    if (file && attachmentUrl) {
      attachmentMessage = this.messageRepository.create({
        ...(existingParentMessage && {
          repliedMessage: existingParentMessage,
        }),
        sender: { id },
        receiver: { id: receiver_id },
        ...(attachmentUrl && { attachment_url: attachmentUrl, type: 'file' }),
      });

      await this.messageRepository.save(attachmentMessage);
    }

    let existingConversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'participant')
      .where('participant.id IN (:...ids)', { ids: [receiver_id, id] })
      .groupBy('conversation.id')
      .having('COUNT(participant.id) = 2')
      .getOne();

    if (!existingConversation) {
      existingConversation = this.conversationRepository.create({
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

      await this.conversationRepository.save(existingConversation);
    } else {
      existingConversation = (await this.conversationRepository.findOne({
        where: { id: existingConversation.id },
        relations: ['messages'],
      })) as Conversation;

      if (newMessage) {
        existingConversation.messages.push(newMessage);
      }

      if (attachmentMessage) {
        existingConversation.messages.push(attachmentMessage);
      }

      await this.conversationRepository.save(existingConversation);
    }

    newMessage = (await this.messageRepository.findOne({
      where: {
        id: newMessage
          ? newMessage.id
          : attachmentMessage
            ? attachmentMessage.id
            : '',
      },
      relations: [
        'receiver',
        'repliedMessage',
        'conversation',
        'conversation.participants',
        'conversation.messages',
        'conversation.messages.sender',
        'conversation.messages.sender.role',
        'conversation.messages.receiver',
        'conversation.messages.receiver.role',
      ],
      select: {
        id: true,
        content: true,
        is_read: true,
        read_at: true,
        type: true,
        attachment_url: true,
        repliedMessage: {
          id: true,
          content: true,
          type: true,
          attachment_url: true,
        },
        receiver: {
          id: true,
          email: true,
          phone_number: true,
          full_name: true,
        },
        conversation: {
          id: true,
          conversation_name: true,
          participants: {
            id: true,
            full_name: true,
            email: true,
          },
          messages: {
            id: true,
            content: true,
            is_read: true,
            read_at: true,
            type: true,
            attachment_url: true,
            sender: {
              id: true,
              email: true,
              phone_number: true,
              full_name: true,
              role: {
                name: true,
              },
            },
            receiver: {
              id: true,
              email: true,
              phone_number: true,
              full_name: true,
              role: {
                name: true,
              },
            },
          },
        },
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

    return newMessage;
  };

  public handleGetMessages = async (user: User) => {
    const { id } = user;

    const conversations = await this.conversationRepository.find({
      where: {
        participants: {
          id,
        },
      },
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

    return conversations.map((conversation) => ({
      ...(conversation?.conversation_name
        ? { conversationName: conversation.conversation_name }
        : { conversationId: conversation.id }),
      messages: conversation.messages,
    }));
  };

  public handleGetMessageOfConversation = async (
    otherUserId: string,
    user: User,
    searchMessagesDto?: SearchMessagesDto,
  ) => {
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

    const query = this.messageRepository
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

    await this.messageRepository.update(
      { id: In(messages.map((m) => m.id)) },
      { is_read: true, read_at: new Date() },
    );

    return messages;
  };

  public handleDeleteConversation = async (
    user: User,
    conversationId: string,
  ) => {
    const { id } = user;

    const conversation = await this.conversationRepository.findOne({
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

    await this.conversationRepository.softDelete({ id: conversationId });

    return {
      success: 'Conversation deleted successfully!',
    };
  };

  public handleUpdateMessage = async (
    user: User,
    messageId: string,
    conversationId: string,
    updateMessageDto: UpdateMessageDto,
  ) => {
    const { id } = user;

    const { content } = updateMessageDto;

    const message = await this.messageRepository.findOne({
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

    const conversation = await this.conversationRepository.findOne({
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

    await this.messageRepository.update(
      {
        id: messageId,
      },
      {
        content,
      },
    );

    return await this.messageRepository.findOne({
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
  };

  public handleDeleteMessage = async (user: User, messageId: string) => {
    const { id } = user;

    const message = await this.messageRepository.findOne({
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

    await this.messageRepository.softDelete({ id: messageId });

    return {
      success: 'Message deleted successfully!',
    };
  };
}

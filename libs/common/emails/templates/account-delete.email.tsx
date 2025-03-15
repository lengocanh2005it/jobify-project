import { Body, Container, Head, Html, Text } from '@react-email/components';

export default function AccountDeletionNoticeEmail() {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.paragraph}>ACCOUNT DELETION NOTICE</Text>
          <Text style={styles.paragraph}>
            Your account has been <span style={styles.highlight}>removed</span>{' '}
            from the Jobify system by an administrator due to violations of our
            security policies.
          </Text>
          <Text style={styles.paragraph}>
            If you believe this was a mistake or need further information,
            please contact our administrator via phone or email.
          </Text>
          <Text style={styles.paragraph}>
            This is an automated email. Please do not reply to this message.
          </Text>
          <Text style={styles.paragraph}>
            Best regards,
            <br />
            <span style={styles.highlight}>Jobify Support Team</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#ffffff',
    fontFamily: '"Times New Roman", Times, serif',
  },
  container: {
    backgroundColor: '#ffffff',
    padding: '20px 0 48px',
    borderRadius: '5px',
  },
  highlight: { color: '#d9534f', fontWeight: 'bold', fontSize: '16px' },
  paragraph: { fontSize: '16px', lineHeight: '26px' },
};

import { Body, Container, Head, Html, Text } from '@react-email/components';

export default function PremiumSubscriptionSuccessEmail() {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.paragraph}>SUBSCRIPTION SUCCESSFUL</Text>
          <Text style={styles.paragraph}>
            You have successfully subscribed to the{' '}
            <span style={styles.highlight}>Premium Plan</span> of our jobify
            application.
          </Text>
          <Text style={styles.paragraph}>
            The Premium Plan offers benefits such as profile highlighting,
            faster access to employers, and many other useful features.
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
  highlight: { color: '#0d5295', fontWeight: 'bold', fontSize: '16px' },
  paragraph: { fontSize: '16px', lineHeight: '26px' },
};

import { Body, Container, Head, Html, Text } from '@react-email/components';

export default function UnrecognizedDeviceLoginEmail({
  userName,
  deviceType,
  location,
  time,
}) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.paragraph}>⚠️ UNRECOGNIZED DEVICE LOGIN</Text>
          <Text style={styles.paragraph}>
            Hello <span style={styles.highlight}>{userName}</span>,
          </Text>
          <Text style={styles.paragraph}>
            We detected a login attempt from a new device:
          </Text>
          <Text style={styles.deviceInfo}>
            📱 Device: <span style={styles.highlight}>{deviceType}</span>
            <br />
            📍 Location: <span style={styles.highlight}>{location}</span>
            <br />⏰ Time: <span style={styles.highlight}>{time}</span>
          </Text>
          <Text style={styles.paragraph}>
            If this was you, no further action is required.
            <br />
            If you don’t recognize this activity, we strongly recommend changing
            your password immediately.
          </Text>
          <Text style={styles.paragraph}>
            This is an automated email. Please do not reply to this message.
          </Text>
          <Text style={styles.paragraph}>
            Best regards,
            <br />
            <span style={styles.highlight}>Security Team</span>
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
  deviceInfo: { fontSize: '16px', lineHeight: '26px', marginBottom: '10px' },
};

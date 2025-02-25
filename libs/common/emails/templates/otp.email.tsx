import { Body, Container, Head, Html, Text } from '@react-email/components';
import React from 'react';

interface OtpEmailProps {
  otp: string;
}

const OtpEmail: React.FC<OtpEmailProps> = ({ otp }) => {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.paragraph}>YOUR OTP VERIFICATION CODE</Text>
          <Text style={styles.paragraph}>
            Here is your one-time password (OTP):
          </Text>
          <Text style={styles.otp}>{otp}</Text>
          <Text style={styles.paragraph}>
            Please enter this code within 2 minutes to complete your
            verification.
          </Text>
          <Text style={styles.paragraph}>
            If you did not request this code, please ignore this email.
          </Text>
          <Text style={styles.paragraph}>
            This is an automated email. Please do not reply.
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
};

export default OtpEmail;

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#ffffff',
    fontFamily: '"Times New Roman", Times, serif',
  },
  container: {
    backgroundColor: '#ffffff',
    padding: '20px 0 48px',
    borderRadius: '5px',
    textAlign: 'center',
  },
  highlight: { color: '#0d5295', fontWeight: 'bold', fontSize: '16px' },
  paragraph: { fontSize: '16px', lineHeight: '26px' },
  otp: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#d9534f',
    margin: '10px 0',
  },
};

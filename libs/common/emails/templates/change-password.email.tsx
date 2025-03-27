import { Body, Container, Head, Html, Text } from '@react-email/components';
import React from 'react';

interface PasswordChangedProps {
  username: string;
}

const PasswordChanged: React.FC<PasswordChangedProps> = ({ username }) => {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.paragraph}>PASSWORD CHANGE CONFIRMATION</Text>
          <Text style={styles.paragraph}>
            Hi {username}, your Jobify account password has been successfully
            updated.
          </Text>
          <Text style={styles.paragraph}>
            If you did not make this change, please reset your password
            immediately and contact our support team.
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

export default PasswordChanged;

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    padding: '20px 0 48px',
    borderRadius: '5px',
    textAlign: 'center',
  },
  highlight: { color: '#0d5295', fontWeight: 'bold', fontSize: '16px' },
  paragraph: { fontSize: '16px', lineHeight: '26px' },
};

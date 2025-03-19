import {
  Body,
  Container,
  Head,
  Html,
  Text,
  Link,
} from '@react-email/components';
import React from 'react';

interface SendReportProps {
  fileUrl: string;
}

const SendReport: React.FC<SendReportProps> = ({ fileUrl }) => {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.paragraph}>SYSTEM REPORT</Text>
          <Text style={styles.paragraph}>
            A new system report has been generated. Please click the link below
            to download it:
          </Text>
          <Link href={fileUrl} style={styles.link}>
            Download Report
          </Link>
          <Text style={styles.paragraph}>
            If you did not request this report, please ignore this email.
          </Text>
          <Text style={styles.paragraph}>
            This is an automated email. Please do not reply.
          </Text>
          <Text style={styles.paragraph}>
            Best regards,
            <br />
            <span style={styles.highlight}>System Support Team</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SendReport;

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
  link: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#007bff',
    textDecoration: 'none',
    display: 'inline-block',
    marginTop: '10px',
  },
};

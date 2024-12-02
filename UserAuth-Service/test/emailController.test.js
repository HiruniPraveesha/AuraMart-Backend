import sendEmail from '../controllers/EmailController.js'; // Adjust the path if necessary
import nodemailer from 'nodemailer';

jest.mock('nodemailer'); // Mock the nodemailer module

describe('sendEmail', () => {
  let consoleSpy;

  beforeEach(() => {
    // Spy on console.log before each test
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore(); // Restore console.log after each test
  });

  test('should send an email successfully', async () => {
    // Mock the createTransport and sendMail methods
    const mockSendMail = jest.fn().mockResolvedValue({
      messageId: 'mock-message-id',
    });
    nodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail,
    });

    const data = {
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test email.',
      htm: '<p>This is a test email.</p>',
    };

    const req = {}; // Mock request if needed
    const res = {}; // Mock response if needed

    await sendEmail(data, req, res); // Call the sendEmail function

    // Ensure that createTransport and sendMail were called with the correct arguments
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_ID,
        pass: process.env.MP,
      },
    });

    expect(mockSendMail).toHaveBeenCalledWith({
      from: '"Hello " <abc@gmail.com>',
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.htm,
    });

    // Assert that the console logs were made
    expect(console.log).toHaveBeenCalledWith('Message sent: %s', 'mock-message-id');
    expect(console.log).toHaveBeenCalledWith('Preview URL: %s', undefined); // Adjust this if preview URL is actually being generated
  });

  test('should throw an error if sendMail fails', async () => {
    // Mock the sendMail method to reject with an error
    const mockSendMail = jest.fn().mockRejectedValue(new Error('Email sending failed'));
    nodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail,
    });

    const data = {
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test email.',
      htm: '<p>This is a test email.</p>',
    };

    const req = {}; // Mock request if needed
    const res = {}; // Mock response if needed

    // Call the sendEmail function and assert that it throws an error
    await expect(sendEmail(data, req, res)).rejects.toThrow('Email sending failed');

    // Ensure sendMail was called with correct arguments
    expect(mockSendMail).toHaveBeenCalledWith({
      from: '"Hello " <abc@gmail.com>',
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.htm,
    });
  });
});

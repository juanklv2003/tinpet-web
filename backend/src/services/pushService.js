const { Expo } = require('expo-server-sdk');

const expo = new Expo();

const sendPushNotification = async (token, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(token)) {
    console.error(`[Push] Invalid Expo push token: ${token}`);
    return;
  }
  
  try {
    const tickets = await expo.sendPushNotificationsAsync([{
      to: token,
      sound: 'default',
      title,
      body,
      data,
      channelId: 'messages'
    }]);
    
    // Log ticket errors
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        console.error(`[Push] Ticket error:`, ticket.message, ticket.details);
      }
    }
  } catch (error) {
    console.error('[Push] Request error:', error);
  }
};

module.exports = { sendPushNotification };

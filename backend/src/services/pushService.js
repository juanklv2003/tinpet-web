const { Expo } = require('expo-server-sdk');

const expo = new Expo();

const sendPushNotification = async (token, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(token)) {
    console.error(`[Push] Invalid Expo push token: ${token}`);
    return;
  }
  
  try {
    await expo.sendPushNotificationsAsync([{
      to: token,
      sound: 'default',
      title,
      body,
      data
    }]);
  } catch (error) {
    console.error('Push error:', error);
  }
};

module.exports = { sendPushNotification };

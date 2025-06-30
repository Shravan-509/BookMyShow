
import { message, notification } from "antd";

/**
 * A unified notify function to use Ant Design's message or notification
 * @param {'success' | 'error' | 'info' | 'warning' | 'loading'} type
 * @param {string} msg - Main title/message
 * @param {string} [desc] - Optional description (shows notification instead of message)
 */

export const notify = (type, msg, desc) => {
  if (desc) 
    {
        notification[type]({
        message: msg,
        description: desc,
        placement: "topRight",
        duration: 4,
        });
  } 
  else 
  {
    message[type](msg);
  }
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { Alert, Button } from 'rsuite';
import { auth, database, storage } from '../../../misc/firebase';
import { groupBy, transformToArrayWithId } from '../../../misc/helpers';
import MessageItem from './MessageItem';

const PAGE_SIZE = 15;
const messagesRef = database.ref('/messages');

function shouldScrollToBottom(node, threshold = 50) {
  const percentage =
    (100 * node.scrollTop) / (node.scrollHeight - node.clientHeight) || 0;

  return percentage > threshold;
}
const Messages = () => {
  const { chatId } = useParams();
  const [messages, setMessages] = useState(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [dataLength, setDataLength] = useState(0);

  // console.log(limit);

  const selfRef = useRef();

  const isChatEmpty = messages && messages.length === 0;
  const canShowMessages = messages && messages.length > 0;

  const loadMessages = useCallback(
    limitToLast => {
      const node = selfRef.current;
      messagesRef.off();

      messagesRef
        .orderByChild('roomId')
        .equalTo(chatId)
        .limitToLast(limitToLast || PAGE_SIZE)
        .on('value', snap => {
          const data = transformToArrayWithId(snap.val());

          if (shouldScrollToBottom(node)) {
            node.scrollTop = node.scrollHeight;
          }

          setMessages(data);
          setDataLength(data.length);
        });

      setLimit(p => {
        if (!limitToLast) {
          return PAGE_SIZE;
        }
        return p + PAGE_SIZE;
      });
    },
    [chatId]
  );
  const onLoadMore = useCallback(() => {
    const node = selfRef.current;
    const oldHeight = node.scrollHeight;

    loadMessages(limit === PAGE_SIZE ? limit + PAGE_SIZE : limit);
    if (limit === PAGE_SIZE) setLimit(p => p + PAGE_SIZE);
    setTimeout(() => {
      const newHeight = node.scrollHeight;
      node.scrollTop = newHeight - oldHeight;
    }, 200);
  }, [loadMessages, limit]);

  console.log(limit, dataLength);

  useEffect(() => {
    const node = selfRef.current;

    loadMessages();

    setTimeout(() => {
      node.scrollTop = node.scrollHeight;
    }, 200);

    return () => {
      messagesRef.off('value');
    };
  }, [loadMessages]);

  const handleAdmin = useCallback(
    async uid => {
      const adminsRef = database.ref(`/rooms/${chatId}/admins`);

      let alertMsg;

      await adminsRef.transaction(admins => {
        if (admins) {
          if (admins[uid]) {
            admins[uid] = null;
            alertMsg = 'admin permission removed';
          } else {
            admins[uid] = true;
            alertMsg = 'admin permission granted';
          }
        }
        return admins;
      });
      Alert.info(alertMsg, 4000);
    },
    [chatId]
  );
  const handleLike = useCallback(async msgId => {
    const messageRef = database.ref(`/messages/${msgId}`);
    const { uid } = auth.currentUser;
    let alertMsg;

    await messageRef.transaction(msg => {
      if (msg) {
        if (msg.likes && msg.likes[uid]) {
          msg.likeCount -= 1;
          msg.likes[uid] = null;
          alertMsg = 'like removed';
        } else {
          msg.likeCount += 1;
          if (!msg.likes) {
            msg.likes = {};
          }
          msg.likes[uid] = true;
          alertMsg = 'Like added';
        }
      }
      return msg;
    });
    Alert.info(alertMsg, 4000);
  }, []);

  const handleDelete = useCallback(
    async (msgId, file) => {
      // eslint-disable-next-line no-alert
      if (!window.confirm('Delete this message ?')) {
        return;
      }
      const isLast = messages[messages.length - 1].id === msgId;
      const updates = {};

      updates[`/messages/${msgId}`] = null;

      if (isLast && messages.length > 1) {
        updates[`/rooms/${chatId}/lastMessage`] = {
          ...messages[messages.length - 2],
          msgId: messages[messages.length - 2].id,
        };
      }
      if (isLast && messages.length === 1) {
        updates[`/rooms/${chatId}/lastMessage`] = null;
      }

      try {
        await database.ref().update(updates);
        Alert.info('messages has been deleted', 4000);
      } catch (err) {
        // eslint-disable-next-line consistent-return
        return Alert.error(err.message, 4000);
      }

      if (file) {
        try {
          const fileRef = await storage.refFromURL(file.url);
          await fileRef.delete();
        } catch (err) {
          Alert.error(err.message, 4000);
        }
      }
    },
    [chatId, messages]
  );

  const renderMessages = () => {
    const groups = groupBy(messages, item =>
      new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'full' })
    );
    const items = [];

    Object.keys(groups).forEach(date => {
      items.push(
        <li className="text-center padded mb-1 " key={date}>
          {date}
        </li>
      );

      // console.log(groups);
      const msgs = groups[date].map(msg => (
        <MessageItem
          key={msg.id}
          message={msg}
          handleLike={handleLike}
          handleAdmin={handleAdmin}
          handleDelete={handleDelete}
        />
      ));

      items.push(...msgs);
      // items.concat(msgs);
    });
    return items;
  };

  return (
    <ul className="msg-list custom-scroll" ref={selfRef}>
      {messages && messages.length >= PAGE_SIZE && (
        <li className="text-center mt-2 mb-2">
          <Button
            style={limit - dataLength > PAGE_SIZE ? { display: 'none' } : {}}
            onClick={onLoadMore}
            color="green"
          >
            Load more
          </Button>
        </li>
      )}

      {isChatEmpty && (
        <div
          className="d-flex h-100 justify-content-center align-items-center"
          style={{ fontSize: '30px' }}
        >
          No messages yet
        </div>
      )}
      {canShowMessages && renderMessages()}
    </ul>
  );
};

export default Messages;

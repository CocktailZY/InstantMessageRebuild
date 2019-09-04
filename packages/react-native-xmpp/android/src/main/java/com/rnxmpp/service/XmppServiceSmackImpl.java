package com.rnxmpp.service;

import com.facebook.react.bridge.ReadableArray;

import org.jivesoftware.smack.*;
import org.jivesoftware.smack.chat.Chat;
import org.jivesoftware.smack.chat.ChatManager;
import org.jivesoftware.smack.chat.ChatManagerListener;
import org.jivesoftware.smack.chat.ChatMessageListener;
import org.jivesoftware.smack.filter.*;
import org.jivesoftware.smack.packet.*;
import org.jivesoftware.smack.provider.ProviderManager;
import org.jivesoftware.smack.roster.Roster;
import org.jivesoftware.smack.roster.RosterEntry;
import org.jivesoftware.smack.roster.RosterLoadedListener;
import org.jivesoftware.smack.sasl.SASLErrorException;
import org.jivesoftware.smack.tcp.XMPPTCPConnection;
import org.jivesoftware.smack.tcp.XMPPTCPConnectionConfiguration;
import org.jivesoftware.smack.util.XmlStringBuilder;
import org.jivesoftware.smack.util.TLSUtils;
import org.jivesoftware.smack.ConnectionConfiguration.SecurityMode;
import org.jivesoftware.smackx.caps.EntityCapsManager;
import org.jivesoftware.smackx.forward.provider.ForwardedProvider;
import org.jivesoftware.smackx.muc.MultiUserChat;
import org.jivesoftware.smackx.muc.MultiUserChatManager;
import org.jivesoftware.smackx.muc.DiscussionHistory;

import android.os.AsyncTask;
import com.rnxmpp.exelement.ST;
import com.rnxmpp.exelement.STProvider;
import com.rnxmpp.exelement.SentProvider;

import java.io.IOException;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;


import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;


/**
 * Created by Kristian Frølund on 7/19/16.
 * Copyright (c) 2016. Teletronics. All rights reserved
 */

public class XmppServiceSmackImpl implements XmppService, ChatManagerListener, StanzaListener, ConnectionListener, ChatMessageListener, RosterLoadedListener {
    XmppServiceListener xmppServiceListener;
    Logger logger = Logger.getLogger(XmppServiceSmackImpl.class.getName());
    XmppGroupMessageListenerImpl groupMessageListner;

    XMPPTCPConnection connection;
    Roster roster;
    List<String> trustedHosts = new ArrayList<>();
    String password;
    private Thread newThread;
    static String[] room_Jids = null;
    static String user_Nicknames = null;
    static XmppServiceListener xmppServiceListener_new;
    public XmppServiceSmackImpl(XmppServiceListener xmppServiceListener) {
        this.xmppServiceListener = xmppServiceListener;
    }

    @Override
    public void trustHosts(ReadableArray trustedHosts) {
        for (int i = 0; i < trustedHosts.size(); i++) {
            this.trustedHosts.add(trustedHosts.getString(i));
        }
    }

    @Override
    public void connect(String jid, String password, String authMethod, String hostname, Integer port) {
        final String[] jidParts = jid.split("@");
        String[] serviceNameParts = jidParts[1].split("/");
        String serviceName = serviceNameParts[0];
        logger.log(Level.INFO, jidParts[0] + "---" + password);
        logger.log(Level.INFO, serviceName);
        logger.log(Level.INFO, serviceNameParts[1]);
        XMPPTCPConnectionConfiguration.Builder confBuilder = XMPPTCPConnectionConfiguration.builder()
                .setServiceName(serviceName)
                .setUsernameAndPassword(jidParts[0], password)
                .setConnectTimeout(3000)
                .setDebuggerEnabled(false)
                .setSendPresence(false)
                .setSecurityMode(SecurityMode.disabled);

        if (serviceNameParts.length > 1) {
            confBuilder.setResource(serviceNameParts[1]);
        } else {
            confBuilder.setResource(Long.toHexString(Double.doubleToLongBits(Math.random())));
        }
        if (hostname != null) {
            confBuilder.setHost(hostname);
        }
        if (port != null) {
            confBuilder.setPort(port);
        }
        if (trustedHosts.contains(hostname) || (hostname == null && trustedHosts.contains(serviceName))) {
            confBuilder.setSecurityMode(SecurityMode.disabled);
            TLSUtils.disableHostnameVerificationForTlsCertificicates(confBuilder);
            try {
                TLSUtils.acceptAllCertificates(confBuilder);
            } catch (NoSuchAlgorithmException | KeyManagementException e) {
                e.printStackTrace();
            }
        }
        SASLAuthentication.blacklistSASLMechanism("SCRAM-SHA-1");
        XMPPTCPConnectionConfiguration connectionConfiguration = confBuilder.build();
        connection = new XMPPTCPConnection(connectionConfiguration);

        connection.addAsyncStanzaListener(this, new OrFilter(new StanzaTypeFilter(IQ.class), new StanzaTypeFilter(Presence.class), new StanzaTypeFilter(Message.class)));
        connection.addConnectionListener(this);

        ChatManager.getInstanceFor(connection).addChatListener(this);
        roster = Roster.getInstanceFor(connection);
        roster.addRosterLoadedListener(this);

        ProviderManager.addExtensionProvider("forwarded","urn:xmpp:forward:0", new ForwardedProvider());
        ProviderManager.addExtensionProvider("sent","urn:xmpp:carbons:2",new SentProvider());
        ProviderManager.addExtensionProvider(ST.ELEMENT_NAME,ST.NAME_SPACE,new STProvider());

        //配置断线重连
        ReconnectionManager reconnectionManager=ReconnectionManager.getInstanceFor(connection);
        reconnectionManager.enableAutomaticReconnection();

        EntityCapsManager mgr = EntityCapsManager.getInstanceFor(connection);
        mgr.disableEntityCaps();

        new AsyncTask<Void, Void, Void>() {

            @Override
            protected Void doInBackground(Void... params) {
                try {
                    connection.connect().login();
                    //将状态设置成离线
//                    Presence presence = new Presence(Presence.Type.unavailable);
//                    connection.sendStanza(presence);
                    /*//将状态设置成在线
                    Presence presence1 = new Presence(Presence.Type.available);
                    connection.sendStanza(presence1);*/
//                    OfflineMessageManager offlineManager = new OfflineMessageManager(connection);
//                    try {
//                        if (!offlineManager.supportsFlexibleRetrieval()) {
////                            System.out.println("1212121");
//                        } else {
//                            List<Message> msgs = offlineManager.getMessages();
//                            //将状态设置成在线
//                            Presence presence1 = new Presence(Presence.Type.available);
//                            presence1.setStatus("在线");
//                            connection.sendStanza(presence1);
//                        }
//
//                    } catch (Exception e) {
//                        e.printStackTrace();
//                    }

                } catch (XMPPException | SmackException | IOException e) {
                    logger.log(Level.SEVERE, "Could not login for user " + jidParts[0], e);
                    if (e instanceof SASLErrorException) {
                        XmppServiceSmackImpl.this.xmppServiceListener.onLoginError(((SASLErrorException) e).getSASLFailure().toString());
                    } else {
                        XmppServiceSmackImpl.this.xmppServiceListener.onError(e);
                    }

                }
                return null;
            }

            @Override
            protected void onPostExecute(Void dummy) {

            }
        }.execute();
    }


    public void joinRoom(String roomJid, String userNickname, Integer historyNum) {
        logger.log(Level.INFO, "房间Jid："+roomJid+"userNickname："+userNickname+"historyNum："+historyNum);
        MultiUserChatManager manager = MultiUserChatManager.getInstanceFor(connection);
        MultiUserChat muc = manager.getMultiUserChat(roomJid);
        try {
            DiscussionHistory history = new DiscussionHistory();
            history.setMaxStanzas(historyNum);
            muc.join(userNickname, "", history, connection.getPacketReplyTimeout());
            groupMessageListner = new XmppGroupMessageListenerImpl(this.xmppServiceListener, logger);
            muc.addMessageListener(groupMessageListner);
            if (muc.isJoined()) {
                logger.log(Level.INFO, "出席：已经进入该房间");
            } else {
                logger.log(Level.INFO, "出席：没有进入该房间");
            }
        } catch (SmackException.NotConnectedException | XMPPException.XMPPErrorException | SmackException.NoResponseException e) {
            logger.log(Level.WARNING, "Could not join chat room", e);
        }
    }
    public void joinRoomNewThread(String roomJid, String userNickname) {
        room_Jids = roomJid.split(",");
        user_Nicknames = userNickname;
        logger.log(Level.INFO, "房间Jid："+roomJid);
        logger.log(Level.INFO, "房间Jids："+room_Jids);
        logger.log(Level.INFO, "userNickname:"+userNickname);
        logger.log(Level.INFO, "user_Nicknames:"+user_Nicknames);
        xmppServiceListener_new = this.xmppServiceListener;
        newThread = new Thread(new Runnable() {
            @Override
            public void run() {
                for(int i=0;i<room_Jids.length;i++){
                    MultiUserChatManager manager = MultiUserChatManager.getInstanceFor(connection);
                    MultiUserChat muc = manager.getMultiUserChat(room_Jids[i]);
                    try {
                        DiscussionHistory history = new DiscussionHistory();
                        history.setMaxStanzas(0);
                        muc.join(user_Nicknames, "", history, connection.getPacketReplyTimeout());
                        groupMessageListner = new XmppGroupMessageListenerImpl(xmppServiceListener_new, logger);
                        muc.addMessageListener(groupMessageListner);
                    } catch (SmackException.NotConnectedException | XMPPException.XMPPErrorException | SmackException.NoResponseException e) {
                        logger.log(Level.WARNING, "Could not join chat room", e);
                    }
                }
            }
        });
        if(room_Jids.length > 0 ){
            newThread.start(); //启动线程
        }
    }
    public void sendRoomMessage(String roomJid, String text) {

        MultiUserChatManager mucManager = MultiUserChatManager.getInstanceFor(connection);
        MultiUserChat muc = mucManager.getMultiUserChat(roomJid);

        try {
            muc.sendMessage(text);
        } catch (SmackException e) {
            logger.log(Level.WARNING, "Could not send group message", e);
        }
    }

    public void leaveRoom(String roomJid) {
        MultiUserChatManager mucManager = MultiUserChatManager.getInstanceFor(connection);
        MultiUserChat muc = mucManager.getMultiUserChat(roomJid);
        logger.log(Level.INFO, muc.getRoom() + ":" + muc.getNickname());
        if (muc.isJoined()) {
            logger.log(Level.INFO, "离开：已经进入该房间");
        } else {
            logger.log(Level.INFO, "离开：没有进入该房间");
        }

        try {
            muc.leave();
            muc.removeMessageListener(groupMessageListner);
        } catch (SmackException e) {
            logger.log(Level.WARNING, "Could not leave chat room", e);
        }
    }

    @Override
    public void message(String text, String to, String thread) {
        String chatIdentifier = (thread == null ? to : thread);

        ChatManager chatManager = ChatManager.getInstanceFor(connection);
        Chat chat = chatManager.getThreadChat(chatIdentifier);
        if (chat == null) {
            if (thread == null) {
                chat = chatManager.createChat(to, this);
            } else {
                chat = chatManager.createChat(to, thread, this);
            }
        }
        try {
            chat.sendMessage(text);
        } catch (SmackException e) {
            logger.log(Level.WARNING, "Could not send message", e);
        }
    }

    @Override
    public void presence(String to, String type) {
        try {
            connection.sendStanza(new Presence(Presence.Type.fromString(type), type, 1, Presence.Mode.fromString(type)));
        } catch (SmackException.NotConnectedException e) {
            logger.log(Level.WARNING, "Could not send presence", e);
        }
    }

    @Override
    public void removeRoster(String to) {
        Roster roster = Roster.getInstanceFor(connection);
        RosterEntry rosterEntry = roster.getEntry(to);
        if (rosterEntry != null) {
            try {
                roster.removeEntry(rosterEntry);
            } catch (SmackException.NotLoggedInException | SmackException.NotConnectedException | XMPPException.XMPPErrorException | SmackException.NoResponseException e) {
                logger.log(Level.WARNING, "Could not remove roster entry: " + to);
            }
        }
    }

    @Override
    public void disconnect() {
        connection.disconnect();
        xmppServiceListener.onDisconnect(null);
    }

    @Override
    public void fetchRoster() {
        try {
            roster.reload();
        } catch (SmackException.NotLoggedInException | SmackException.NotConnectedException e) {
            logger.log(Level.WARNING, "Could not fetch roster", e);
        }
    }

    public class StanzaPacket extends org.jivesoftware.smack.packet.Stanza {
        private String xmlString;

        public StanzaPacket(String xmlString) {
            super();
            this.xmlString = xmlString;
        }

        @Override
        public XmlStringBuilder toXML() {
            XmlStringBuilder xml = new XmlStringBuilder();
            xml.append(this.xmlString);
            return xml;
        }
    }

    @Override
    public void sendStanza(String stanza) {
        StanzaPacket packet = new StanzaPacket(stanza);
        try {
            connection.sendPacket(packet);
        } catch (SmackException e) {
            logger.log(Level.WARNING, "Could not send stanza", e);
        }
    }

    @Override
    public void chatCreated(Chat chat, boolean createdLocally) {
        chat.addMessageListener(this);
    }

    @Override
    public void processPacket(Stanza packet) throws SmackException.NotConnectedException {
        if (packet instanceof IQ) {
            if (packet instanceof UnparsedIQ) {
                this.xmppServiceListener.onUnparsedIQ((UnparsedIQ) packet);
            } else {
                this.xmppServiceListener.onIQ((IQ) packet);
            }
        } else if (packet instanceof Presence) {
            this.xmppServiceListener.onPresence((Presence) packet);
        } else if (packet instanceof Message) {
//           boolean flag = new PacketExtensionFilter("sent","urn:xmpp:carbons:2").accept(packet);
            Message tempMsg = (Message) packet;
//            if(tempMsg.getType() == Message.Type.groupchat){
                this.xmppServiceListener.onMessage(tempMsg);
                logger.log(Level.INFO, "Received a new multi message", tempMsg.toString());
//            }
        } else {
            logger.log(Level.WARNING, "Got a Stanza, of unknown subclass", packet.toXML());
        }
    }


    @Override
    public void connected(XMPPConnection connection) {
        this.xmppServiceListener.onConnnect(connection.getUser(), password);
    }

    @Override
    public void authenticated(XMPPConnection connection, boolean resumed) {
        this.xmppServiceListener.onLogin(connection.getUser(), password);
    }

    @Override
    public void processMessage(Chat chat, Message message) {
//        this.xmppServiceListener.onMessage(message);
//       logger.log(Level.INFO, "Received a new chat message", message.toString());
    }

    @Override
    public void onRosterLoaded(Roster roster) {
        this.xmppServiceListener.onRosterReceived(roster);
    }

    @Override
    public void connectionClosedOnError(Exception e) {
        this.xmppServiceListener.onDisconnect(e);
    }

    @Override
    public void connectionClosed() {
        logger.log(Level.INFO, "Connection was closed.");
    }

    @Override
    public void reconnectionSuccessful() {
        logger.log(Level.INFO, "Did reconnect");
    }

    @Override
    public void reconnectingIn(int seconds) {
        logger.log(Level.INFO, "Reconnecting in {0} seconds", seconds);
    }

    @Override
    public void reconnectionFailed(Exception e) {
        logger.log(Level.WARNING, "Could not reconnect", e);

    }

}

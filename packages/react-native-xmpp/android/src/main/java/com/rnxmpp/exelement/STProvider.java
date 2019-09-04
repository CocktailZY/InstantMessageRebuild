package com.rnxmpp.exelement;

import android.util.Log;
import org.jivesoftware.smack.SmackException;
import org.jivesoftware.smack.provider.ExtensionElementProvider;
import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;

import java.io.IOException;
import java.util.logging.Logger;

import static android.content.ContentValues.TAG;

public class STProvider extends ExtensionElementProvider {
	private static final Logger LOGGER = Logger.getLogger(STProvider.class.getName());

	@Override
	public ST parse(XmlPullParser parser, int initialDepth) throws XmlPullParserException, IOException, SmackException {
		String content = "";
		outerloop:
		while (true) {
			int eventType = parser.next();
			switch (eventType) {
				case XmlPullParser.START_TAG:
					Log.e(TAG,"进入开始标签-------------------------");
					String name = parser.getName();
					String namespace = parser.getNamespace();
					LOGGER.info(name + "---="+namespace+"==---"+parser.getAttributeValue(0));
					switch (name) {
						case "st":
							content = parser.nextText();
							break;
//						case Message.ELEMENT:
//							packet = PacketParserUtils.parseExtensionElement("st","urn:xmpp:serverSend",parser);
//							break;
						default:
							LOGGER.warning("Unsupported forwarded packet type: " + name);
					}
					break;
				case XmlPullParser.TEXT:
					Log.e(TAG,"进入文本-------------------------");
					String value = parser.getText();
					Log.e(TAG,value);
					content = value;
					break;
				case XmlPullParser.END_TAG:
					Log.e(TAG,"进入结束标签-------------------------");
					if (parser.getDepth() == initialDepth) {
						break outerloop;
					}
					break;
			}
		}
		return new ST("st",content);
	}
}

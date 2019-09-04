package com.rnxmpp.exelement;


import org.jivesoftware.smack.SmackException;
import org.jivesoftware.smack.packet.Stanza;
import org.jivesoftware.smack.provider.ExtensionElementProvider;
import org.jivesoftware.smackx.delay.packet.DelayInformation;
import org.jivesoftware.smackx.forward.packet.Forwarded;
import org.jivesoftware.smackx.forward.provider.ForwardedProvider;
import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;

import java.io.IOException;
import java.util.logging.Logger;

public class SentProvider extends ExtensionElementProvider {
	private static final Logger LOGGER = Logger.getLogger(SentProvider.class.getName());

	@Override
	public Sent parse(XmlPullParser parser, int initialDepth) throws XmlPullParserException, IOException, SmackException {
		Forwarded di = null;
		Stanza packet = null;
		String content = "";

		outerloop: while (true) {
			int eventType = parser.next();
			switch (eventType) {
				case XmlPullParser.START_TAG:
					String name = parser.getName();
					String namespace = parser.getNamespace();
					LOGGER.info(name+"---===---"+namespace);
					switch (name) {
						case "forwarded":
							if ("urn:xmpp:forward:0".equals(namespace)) {
//								String secName =
								di = new ForwardedProvider().parse(parser, parser.getDepth());
								LOGGER.info(di.toXML().toString());
							} else {
								LOGGER.warning("Namespace '" + namespace + "' does not match expected namespace '"
									+ DelayInformation.NAMESPACE + "'");
							}
							break;
						case "removeMsg":
							content = parser.nextText();
							break;
						default:
							LOGGER.warning("Unsupported forwarded packet type: " + name);
					}
					break;
				case XmlPullParser.END_TAG:
					if (parser.getDepth() == initialDepth) {
						break outerloop;
					}
					break;
			}
		}
		if(di !=null){

			return new Sent("removeMsg",di.toXML().toString());
		}else{
			return new Sent("removeMsg","");
		}
	}
}

package com.rnxmpp.exelement;

import org.jivesoftware.smack.packet.ExtensionElement;

public class ST implements ExtensionElement {
	public static final String NAME_SPACE = "urn:xmpp:serverSend";
	public static final String ELEMENT_NAME = "st";

	private String elementAtt = "";
	private String elementText = "";

	public String getElementAtt() {
		return elementAtt;
	}

	public void setElementAtt(String elementAtt) {
		this.elementAtt = elementAtt;
	}

	public String getElementText() {
		return elementText;
	}

	public void setElementText(String elementText) {
		this.elementText = elementText;
	}

	public ST(String elementAtt, String elementText) {
		this.elementAtt = elementAtt;
		this.elementText = elementText;
	}

	@Override
	public String getNamespace() {
		return NAME_SPACE;
	}

	@Override
	public String getElementName() {
		return ELEMENT_NAME;
	}

	@Override
	public CharSequence toXML() {
		StringBuilder sb = new StringBuilder();

		sb.append("<").append(ELEMENT_NAME).append(" xmlns=\"").append(NAME_SPACE).append("\">");
		sb.append(elementText);
		sb.append("</"+ELEMENT_NAME+">");

		return sb.toString();
	}
}

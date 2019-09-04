package com.rnxmpp.exelement;

import org.jivesoftware.smack.packet.ExtensionElement;


public class Sent implements ExtensionElement {
	public static final String NAME_SPACE = "urn:xmpp:carbons:2";
	//用户信息元素名称
	public static final String ELEMENT_NAME = "sent";

	//用户昵称元素名称
	private String nameElement = "forwarded";
	private String nameText = "123";

	public Sent(String nameElement, String nameText) {
		this.nameElement = nameElement;
		this.nameText = nameText;
	}
	public String getNameText() {
		return nameText;
	}

	public void setNameText(String nameText) {
		this.nameText = nameText;
	}

	public String getNameElement() {
		return nameElement;
	}

	public void setNameElement(String nameElement) {
		this.nameElement = nameElement;
	}

	@Override
	public CharSequence toXML() {
		StringBuilder sb = new StringBuilder();

		sb.append("<").append(ELEMENT_NAME).append(" xmlns=\"").append(NAME_SPACE).append("\">");
		sb.append(nameText);
		sb.append("</"+ELEMENT_NAME+">");

		return sb.toString();

	}

	@Override
	public String getNamespace() {
		return "urn:xmpp:carbons:2";
	}

	@Override
	public String getElementName() {
		return "sent";
	}
}

import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default CommitBtn = (props) => {
  return (
    <TouchableOpacity
      onPress={props.onBtnPressCallback}
      onLongPress={props.onLongPress}
      onPressOut={props.onPressOut}
      style={props.btnStyle}
    >
      <Text style={styles.btn_text}>{props.btnText}</Text>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  btn_text: {
    color: "#ffffff"
  }
});

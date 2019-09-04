import React, {Component} from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    TextInput,
    Platform
} from 'react-native';


export default class CustomTextInput extends Component {

    constructor(props) {
        super(props);
    }


    onBlurText = () =>{
        this._inputBox.blur()
    }

    onFocusText = () =>{
        this._inputBox.focus();
    }

    // shouldComponentUpdate(nextProps){
    //     return  false
    // }

    render() {
        return (
            <TextInput
                ref={(TextInput) => this._inputBox = TextInput}
                style={this.props.textInputStyle}
                placeholderTextColor={'#cccccc'}
                secureTextEntry={this.props.secure}
                placeholder={this.props.placeholder}
                multiline={this.props.multilineFlag}
                underlineColorAndroid={this.props.underlineColor}
                onChangeText={(text) => this.props.onChangeCallBack(text)}
                // onSelectionChange={(event) => this.props.onSelectionChangeCallBack}
                value={this.props.value}
                onFocus={()=>this.props.onFocusCallBack}
                onBlur={() =>this.props.onBlurCallBack}
                onSelectionChange={(event) =>this.props.onSelectionChangeCallBack(event)}
                // underlineColorAndroid='transparent'
                returnKeyType={this.props.returnType}
                returnKeyLabel={this.props.returnLabel}
                onKeyPress={(event) => {}}
                onSubmitEditing={this.props.submitText}
            >
            </TextInput>
        )
    }
}
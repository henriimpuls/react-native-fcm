/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Clipboard,
  Platform
} from 'react-native';

import { StackNavigator } from 'react-navigation';

import FCM, {NotificationActionType} from "react-native-fcm";

import {registerKilledListener, registerAppListener} from "./Listeners";
import firebaseClient from  "./FirebaseClient";

registerKilledListener();

class MainPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      token: "",
      tokenCopyFeedback: ""
    }
  }

  async componentDidMount(){
    registerAppListener(this.props.navigation);
    FCM.getInitialNotification().then(notif => {
      this.setState({
        initNotif: notif
      })
      if(notif && notif.targetScreen === 'detail'){
        setTimeout(()=>{
          this.props.navigation.navigate('Detail')
        }, 500)
      }
    });

    try{
      let result = await FCM.requestPermissions({badge: false, sound: true, alert: true});
    } catch(e){
      console.error(e);
    }

    FCM.getFCMToken().then(token => {
      console.log("TOKEN (getFCMToken)", token);
      this.setState({token: token || ""})
    });

    if(Platform.OS === 'ios'){
      FCM.getAPNSToken().then(token => {
        console.log("APNS TOKEN (getFCMToken)", token);
      });
    }
  }

  showLocalNotification() {
    FCM.presentLocalNotification({
      vibrate: 500,
      title: 'Hello',
      body: 'Click me to detail page,',
      big_text: 'Large Text Large Text Large Text Large Text Large Text Large Text Large Text Large Text Large Text Large Text Large Text Large Text Large Text Large Text ',
      priority: "high",
      sound: "bell.mp3",
      large_icon: "https://image.freepik.com/free-icon/small-boy-cartoon_318-38077.jpg",
      show_in_foreground: true,
      group: 'test',
      targetScreen: 'detail',
      number: 10
    });
  }

  scheduleLocalNotification() {
    FCM.scheduleLocalNotification({
      id: 'testnotif',
      fire_date: new Date().getTime()+5000,
      vibrate: 500,
      title: 'Hello',
      body: 'Test Scheduled Notification',
      sub_text: 'sub text',
      priority: "high",
      large_icon: "https://image.freepik.com/free-icon/small-boy-cartoon_318-38077.jpg",
      show_in_foreground: true,
      picture: 'https://firebase.google.com/_static/af7ae4b3fc/images/firebase/lockup.png',
      wake_screen: true,
      extra1: {a: 1},
      extra2: 1
    });
  }

  sendRemoteNotification(token) {
    let body;

    if(Platform.OS === 'android'){
      body = {
        "to": token,
      	"data":{
					"custom_notification": {
						"title": "Simple FCM Client",
						"body": "Click me to go to detail",
						"sound": "default",
						"priority": "high",
            "show_in_foreground": true,
            targetScreen: 'detail'
        	}
    		},
    		"priority": 10
      }
    } else {
			body = {
				"to": token,
				"notification":{
					"title": "Simple FCM Client",
					"body": "Click me to go to detail",
					"sound": "default"
        },
        data: {
          targetScreen: 'detail'
        },
				"priority": 10
			}
		}

    firebaseClient.send(JSON.stringify(body), "notification");
  }

  sendRemoteData(token) {
    let body = {
    	"to": token,
      "data":{
    		"title": "Simple FCM Client",
    		"body": "This is a notification with only DATA.",
    		"sound": "default"
    	},
    	"priority": "normal"
    }

    firebaseClient.send(JSON.stringify(body), "data");
  }

  showLocalNotificationWithAction() {
    FCM.presentLocalNotification({
      title: 'Test Notification with action',
      body: 'Force touch to reply',
      priority: "high",
      show_in_foreground: true,
      click_action: "com.myidentifi.fcm.text", // for ios
      android_actions: JSON.stringify([{
        id: "view",
        title: 'view'
      },{
        id: "dismiss",
        title: 'dismiss'
      }]) // for android, take syntax similar to ios's. only buttons are supported
    });
  }

  render() {
    let { token, tokenCopyFeedback } = this.state;

    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to Simple Fcm Client!
        </Text>

        <Text style={styles.feedback}>
          {this.state.tokenCopyFeedback}
        </Text>

        <Text style={styles.feedback}>
          Remote notif won't be available to iOS emulators
        </Text>

        <TouchableOpacity onPress={() => this.sendRemoteNotification(token)} style={styles.button}>
          <Text style={styles.buttonText}>Send Remote Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => this.sendRemoteData(token)} style={styles.button}>
          <Text style={styles.buttonText}>Send Remote Data</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => this.showLocalNotification()} style={styles.button}>
          <Text style={styles.buttonText}>Show Local Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => this.showLocalNotificationWithAction(token)} style={styles.button}>
          <Text style={styles.buttonText}>Show Local Notification with Action</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => this.scheduleLocalNotification()} style={styles.button}>
          <Text style={styles.buttonText}>Schedule Notification in 5s</Text>
        </TouchableOpacity>

        <Text>
          Init notif: {JSON.stringify(this.state.initNotif)}
        </Text>

        <Text selectable={true} onPress={() => this.setClipboardContent(this.state.token)} style={styles.instructions}>
          Token: {this.state.token}
        </Text>

      </View>
    );
  }

  setClipboardContent(text) {
    Clipboard.setString(text);
    this.setState({tokenCopyFeedback: "Token copied to clipboard."});
    setTimeout(() => {this.clearTokenCopyFeedback()}, 2000);
  }

  clearTokenCopyFeedback() {
    this.setState({tokenCopyFeedback: ""});
  }
}

class DetailPage extends Component {
  render(){
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Detail page</Text>
    </View>
  }
}

export default StackNavigator({
  Main: {
    screen: MainPage,
  },
  Detail: {
    screen: DetailPage
  }
}, {
  initialRouteName: 'Main',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 2,
  },
  feedback: {
    textAlign: 'center',
    color: '#996633',
    marginBottom: 3,
  },
  button: {
    backgroundColor: "teal",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginVertical: 15,
    borderRadius: 10
  },
  buttonText: {
    color: "white",
    backgroundColor: "transparent"
  },
});

import React from "react";
import moment from "moment";
import {
  Alert,
  ActionSheetIOS,
  StatusBar,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity
} from "react-native";

import CalendarSquare from "./CalendarSquare.js";
import TimePickerModal from "./TimePickerModal.js";
import Database from "./Database.js";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    const targetMoment = moment();
    // TODO get/set these from storage
    const targetMinute = 30;
    const targetHour = 19;
    targetMoment
      .second(59)
      .minute(targetMinute)
      .hour(targetHour);
    this.state = {
      goal: "Leave work by",
      logDate: new Date(),
      targetDate: targetMoment.toDate(),
      logDateModalVisible: false,
      targetDateModalVisible: false,
      allRows: JSON.stringify({})
    };
    this.setLogDate = this.setLogDate.bind(this);
    this.setTargetDate = this.setTargetDate.bind(this);
    this.setGoal = this.setGoal.bind(this);
    this._logTime = this._logTime.bind(this);
    this.updateHistory = this.updateHistory.bind(this);
    this._shareMessage = this._shareMessage.bind(this);
  }

  componentWillMount() {
    StatusBar.setHidden(true);
  }

  componentDidMount() {
    Database.initTable();
    this.updateHistory();
    const updateTime = () => {
      const date = new Date();
      const secondsUntilMinuteChange = 60 - moment(date).second();
      this.setState({ logDate: date });
      // Hack to add a tenth of a second of slack time
      setTimeout(updateTime, (secondsUntilMinuteChange + 0.1) * 1000);
    };
    updateTime();
  }

  updateHistory() {
    Database.getAll(rows => {
      this.setState({ allRows: JSON.stringify(rows) });
    });
  }

  _onPressButton() {
    Alert.alert("You tapped the button!");
  }

  _logTime() {
    // Vibration.vibrate();
    const logMoment = moment(this.state.logDate);
    const targetMoment = moment(this.state.targetDate);
    const success = logMoment.isSameOrBefore(targetMoment);
    Database.upsert(
      logMoment.toISOString(),
      targetMoment.toISOString(),
      shortFormat(logMoment),
      shortFormat(targetMoment),
      success,
      () => {
        this.updateHistory();
      }
    );
    let title = "Good job.";
    let description = "You did it!";
    if (!success) {
      title = "Glad you left!";
      description =
        "You should have left " + targetMoment.from(logMoment) + ".";
    }
    Alert.alert(title, description, [
      { text: "Share", onPress: () => this._shareMessage() },
      { text: "OK" }
    ]);
  }

  _shareMessage() {
    // TODO add emoji if chosen date is before/after target date
    Share.share({
      message: "Just left work " + moment(this.state.logDate).fromNow(),
      excludedActivityTypes: kExcludedActivities
    });
  }

  adjustTargetTime() {
    this.setTargetDateModalVisible(true);
  }

  adjustLogTime() {
    this.setLogDateModalVisible(true);
  }

  setLogDate(newDate) {
    this.setState({ logDate: newDate });
  }

  setTargetDate(newDate) {
    this.setState({ targetDate: newDate });
  }

  async setGoal(goal) {
    this.setState({ goal });
  }

  setTargetDateModalVisible(visible, callback) {
    this.setState({ targetDateModalVisible: visible }, callback);
  }

  setLogDateModalVisible(visible, callback) {
    this.setState({ logDateModalVisible: visible }, callback);
  }

  showPressActionSheet() {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          "Cancel",
          "Log current time",
          "Choose custom time",
          "Clear all history"
        ],
        title: "Press and hold the button to log faster.",
        cancelButtonIndex: 0
      },
      index => {
        if (index == 1) {
          this._logTime();
        } else if (index == 2) {
          this.adjustLogTime();
        } else if (index == 3) {
          // TODO move to settings
          Alert.alert("Really delete everything?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete everything",
              style: "destructive",
              onPress: () => {
                Database.deleteTable();
                Database.initTable(this.updateHistory);
              }
            }
          ]);
        }
      }
    );
  }

  getHistoryElem() {
    const daysElems = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(str => {
      const style = { height: 24, width: 45, textAlign: "center" };
      return (
        <Text key={str} style={style}>
          {str}
        </Text>
      );
    });
    const data = JSON.parse(this.state.allRows);
    const rowsByTarget = {};
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      rowsByTarget[row.targetShortDate] = row;
    }
    const firstWeek = [];
    const secondWeek = [];
    const nowMoment = moment();
    const nowDay = nowMoment.day(); // Sunday is 0, Sat is 6
    // Start with the day two Sundays ago
    for (let diff = 7 + nowDay; diff >= 0; diff -= 1) {
      const entryMoment = nowMoment.clone().subtract(diff, "days");
      const matching = rowsByTarget[shortFormat(entryMoment)];
      const week = diff > nowDay ? firstWeek : secondWeek;
      if (matching) {
        week.push(
          <CalendarSquare
            key={matching.id}
            success={Boolean(matching.success)}
            date={matching.logDate}
          />
        );
      } else {
        week.push(
          <CalendarSquare key={shortFormat(entryMoment)} date={null} />
        );
      }
    }
    return (
      <View style={styles.historyContainer}>
        <View style={{ alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {daysElems}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {firstWeek}
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {secondWeek}
          </View>
        </View>
      </View>
    );
    // <Text>{JSON.stringify(this.state.allRows)}</Text>
  }

  render() {
    const targetDatePickerModal = (
      <TimePickerModal
        date={this.state.targetDate}
        dateChangeFn={this.setTargetDate}
        isVisible={this.state.targetDateModalVisible}
        buttonTitle={"Dismiss"}
        buttonAction={() => {
          this.setTargetDateModalVisible(!this.state.targetDateModalVisible);
        }}
      />
    );
    const logDatePickerModal = (
      <TimePickerModal
        date={this.state.logDate}
        dateChangeFn={this.setLogDate}
        isVisible={this.state.logDateModalVisible}
        buttonTitle={"Save"}
        buttonAction={() => {
          this.setLogDateModalVisible(!this.state.logDateModalVisible, () => {
            setTimeout(() => {
              this._logTime();
            }, 1000); // Delay a bit, weird race with the modal.
          });
        }}
      />
    );

    return (
      <View style={styles.container}>
        {targetDatePickerModal}
        {logDatePickerModal}

        <View style={styles.goalContainer}>
          <TextInput
            style={{
              fontSize: 16,
              textAlign: "center",
              overflow: "hidden",
              paddingLeft: 8,
              paddingRight: 8
            }}
            value={this.state.goal}
            width="100%"
            onChangeText={this.setGoal}
          />
          <Text
            style={{ fontSize: 34, margin: 2 }}
            onPress={() => {
              this.adjustTargetTime();
            }}
          >
            {moment(this.state.targetDate).format(" h:mm a")}
          </Text>
          <Text style={{ fontSize: 16 }}>
            {moment(this.state.targetDate).fromNow()}
          </Text>
        </View>
        {this.getHistoryElem()}
        <View style={styles.logContainer}>
          <View style={styles.logButtonContainer}>
            <TouchableOpacity
              onPress={() => {
                this.showPressActionSheet();
              }}
              onLongPress={this._logTime}
            >
              <View style={styles.logButton}>
                <Text style={{ fontSize: 34, color: "white" }}>
                  {moment(this.state.logDate).format("h:mm a")}
                </Text>
                <Text style={{ fontSize: 16, paddingTop: 4, color: "white" }}>
                  Hold to save
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  buttonText: {
    color: "white",
    textAlign: "center"
  },
  goalContainer: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: "#DAE3E2"
    backgroundColor: "#D2D3DC"
    // backgroundColor: "#C4AD99"
  },
  historyContainer: {
    flex: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  logContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    // backgroundColor: "#2B4623"
    backgroundColor: "#2C3F5B"
    // backgroundColor: "#1586D8"
  },
  logButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40
  },
  logButton: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    height: 170,
    width: 170,
    borderRadius: 1000,
    backgroundColor: "#2196F3"
  }
});

const shortFormat = momentItem => momentItem.format("MM-DD-YYYY");

const kExcludedActivities = [
  "com.apple.UIKit.activity.PostToFacebook",
  "com.apple.UIKit.activity.PostToTwitter",
  "com.apple.UIKit.activity.PostToWeibo",
  // "com.apple.UIKit.activity.Message",
  "com.apple.UIKit.activity.Mail",
  "com.apple.UIKit.activity.Print",
  "com.apple.UIKit.activity.CopyToPasteboard",
  "com.apple.UIKit.activity.AssignToContact",
  "com.apple.UIKit.activity.SaveToCameraRoll",
  "com.apple.UIKit.activity.AddToReadingList",
  "com.apple.UIKit.activity.PostToFlickr",
  "com.apple.UIKit.activity.PostToVimeo",
  "com.apple.UIKit.activity.PostToTencentWeibo",
  "com.apple.UIKit.activity.AirDrop",
  "com.apple.UIKit.activity.OpenInIBooks",
  "com.apple.UIKit.activity.MarkupAsPDF",
  "com.apple.reminders.RemindersEditorExtension", // Reminders
  "com.apple.mobilenotes.SharingExtension", // Notes
  "com.apple.mobileslideshow.StreamShareService", // iCloud Photo Sharing - This also does nothing :{

  // Not supported
  "com.google.Gmail.ShareExtension", // Gmail
  "com.linkedin.LinkedIn.ShareExtension", // LinkedIn
  "pinterest.ShareExtension", // Pinterest
  "com.google.GooglePlus.ShareExtension", // Google +
  "com.tumblr.tumblr.Share-With-Tumblr", // Tumblr
  "wefwef.YammerShare", // Yammer
  "com.hootsuite.hootsuite.HootsuiteShareExt", // HootSuite
  "net.naan.TwitterFonPro.ShareExtension-Pro", // Echofon
  "com.hootsuite.hootsuite.HootsuiteShareExt", // HootSuite
  "net.whatsapp.WhatsApp.ShareExtension" // WhatsApp
];

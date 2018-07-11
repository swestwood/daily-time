import React from "react";
import moment from "moment";
import { SQLite } from "expo";
import {
  Alert,
  ActionSheetIOS,
  StatusBar,
  Share,
  Modal,
  DatePickerIOS,
  StyleSheet,
  Button,
  Text,
  TextInput,
  View,
  TouchableOpacity
} from "react-native";

const db = SQLite.openDatabase("dailytime-1.db");

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

  getTimePickerModal(date, dateChangeFn, isVisible, buttonTitle, buttonAction) {
    // mode="time"
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => {}}
      >
        <View style={{ justifyContent: "flex-end", height: "100%" }}>
          <View
            style={{ opacity: 1, backgroundColor: "white", paddingBottom: 8 }}
          >
            <DatePickerIOS
              onDateChange={dateChangeFn}
              date={date}
              minuteInterval={5}
            />
            <Button onPress={buttonAction} title={buttonTitle} />
          </View>
        </View>
      </Modal>
    );
  }

  getHistoryElem() {
    const nowMoment = moment();
    const nowDay = nowMoment.day(); // Sunday is 0, Sat is 6
    // Find the day corresponding to two Sundays ago
    const dayStyle = { height: 50, width: 42, textAlign: "center" };
    const daysElems = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(str => {
      const style = { height: 50, width: 42, textAlign: "center" };
      return (
        <Text key={str} style={style}>
          {str}
        </Text>
      );
    });
    const firstWeek = [];
    const secondWeek = [];
    const data = JSON.parse(this.state.allRows);
    const map = {};
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      map[row.targetShortDate] = row;
    }
    for (let diff = 7 + nowDay; diff > nowDay; diff -= 1) {
      const entryMoment = nowMoment.clone().subtract(diff, "days");
      const matching = map[shortFormat(entryMoment)];
      const style = Object.assign({}, dayStyle);
      if (matching) {
        style.color = matching.success ? "green" : "red";
        firstWeek.push(
          <Text style={style} key={matching.id}>
            {moment(matching.logDate).format("h:mm a")}
          </Text>
        );
      } else {
        style.color = "gray";
        firstWeek.push(
          <Text style={style} key={shortFormat(entryMoment)}>
            n/a
          </Text>
        );
      }
    }
    for (let diff = nowDay; diff >= 0; diff -= 1) {
      const entryMoment = nowMoment.clone().subtract(diff, "days");
      const matching = map[shortFormat(entryMoment)];
      const style = Object.assign({}, dayStyle);

      if (matching) {
        style.color = matching.success ? "green" : "red";
        secondWeek.push(
          <Text style={style} key={matching.id}>
            {moment(matching.logDate).format("h:mm a")}
          </Text>
        );
      } else {
        style.color = "gray";
        secondWeek.push(
          <Text style={style} key={shortFormat(entryMoment)}>
            n/a
          </Text>
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
    const targetDatePickerModal = this.getTimePickerModal(
      this.state.targetDate,
      this.setTargetDate,
      this.state.targetDateModalVisible,
      "Dismiss",
      () => {
        this.setTargetDateModalVisible(!this.state.targetDateModalVisible);
      },
      "Dismiss"
    );
    const logDatePickerModal = this.getTimePickerModal(
      this.state.logDate,
      this.setLogDate,
      this.state.logDateModalVisible,
      "Save",
      () => {
        this.setLogDateModalVisible(!this.state.logDateModalVisible, () => {
          setTimeout(() => {
            this._logTime();
          }, 1000); // Delay a bit, weird race with the modal.
        });
      }
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
    backgroundColor: "lightgreen"
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
    backgroundColor: "lightblue"
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

class Database {
  static queryByTargetShortDate(targetShort, callback) {
    db.transaction(tx => {
      tx.executeSql(
        `select * from entries where targetShortDate = ?;`,
        [targetShort],
        (_, { rows: { _array } }) => {
          callback(_array);
        }
      );
    });
  }

  static initTable(updateFn) {
    db.transaction(
      tx => {
        // Database.deleteTable();
        tx.executeSql(
          "create table if not exists entries (id integer primary key not null, logDate text, targetDate text, logShortDate text, targetShortDate text, success int);"
        );
      },
      null,
      updateFn
    );
  }

  static deleteTable() {
    db.transaction(tx => {
      tx.executeSql("drop table entries");
    });
  }

  static add(
    logDate,
    targetDate,
    logShortDate,
    targetShortDate,
    success,
    updateFn
  ) {
    db.transaction(
      tx => {
        this._executeInsert(
          tx,
          logDate,
          targetDate,
          logShortDate,
          targetShortDate,
          success
        );
      },
      e => {
        console.error(e);
      },
      updateFn
    );
  }

  static upsert(
    logDate,
    targetDate,
    logShortDate,
    targetShortDate,
    success,
    updateFn
  ) {
    db.transaction(
      tx => {
        this._executeDelete(tx, targetShortDate);
        this._executeInsert(
          tx,
          logDate,
          targetDate,
          logShortDate,
          targetShortDate,
          success
        );
      },
      e => {
        console.error(e);
      },
      updateFn
    );
  }

  static getAll(callback) {
    db.transaction(tx => {
      tx.executeSql("select * from entries", [], (_, { rows }) => {
        console.log(rows);
        callback(rows._array);
      });
    });
  }

  static _executeInsert(
    tx,
    logDate,
    targetDate,
    logShortDate,
    targetShortDate,
    success
  ) {
    tx.executeSql(
      "insert into entries (logDate, targetDate, logShortDate, targetShortDate, success) values (?, ?, ?, ?, ?)",
      [logDate, targetDate, logShortDate, targetShortDate, success]
    );
  }

  static _executeDelete(tx, targetShortDate) {
    tx.executeSql(`delete from entries where targetShortDate = ?;`, [
      targetShortDate
    ]);
  }
}

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

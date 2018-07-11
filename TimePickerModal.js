import React from "react";
import PropTypes from "prop-types";
import { Modal, View, DatePickerIOS, Button } from "react-native";

export default class TimePickerModal extends React.Component {
  render() {
    const props = this.props;
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={props.isVisible}
        onRequestClose={() => {}}
      >
        <View style={{ justifyContent: "flex-end", height: "100%" }}>
          <View
            style={{ opacity: 1, backgroundColor: "white", paddingBottom: 8 }}
          >
            <DatePickerIOS
              onDateChange={props.dateChangeFn}
              date={props.date}
              mode="time"
              minuteInterval={5}
            />
            <Button onPress={props.buttonAction} title={props.buttonTitle} />
          </View>
        </View>
      </Modal>
    );
  }
}

TimePickerModal.propTypes = {
  date: PropTypes.instanceOf(Date),
  isVisible: PropTypes.bool,
  dateChangeFn: PropTypes.func,
  buttonTitle: PropTypes.date,
  buttonAction: PropTypes.func
};

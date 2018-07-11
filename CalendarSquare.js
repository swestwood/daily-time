import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { Text, View } from "react-native";

export default class CalendarSquare extends React.Component {
  render() {
    const props = this.props;
    const style = {
      height: 50,
      width: 45,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "lightgray"
    };
    let content;
    if (!props.date) {
      style.backgroundColor = "#D2D3DC";
      content = " ";
    } else {
      style.backgroundColor = props.success ? "lightgreen" : "#FFC0CB";
      content = moment(props.date).format("h:mm a");
    }
    return (
      <View style={style}>
        <Text
          style={{
            textAlign: "center",
            color: props.success ? "darkgreen" : "red"
          }}
        >
          {content}
        </Text>
      </View>
    );
  }
}

CalendarSquare.propTypes = {
  success: PropTypes.bool,
  date: PropTypes.string
};

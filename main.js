import Expo, { Constants } from 'expo';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Share,
  TextInput,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard
} from 'react-native';
import axios from 'axios';
import Config from './config';

// 末尾のスラッシュは必要（ref: https://github.com/feross/buffer）
import { Buffer } from 'buffer/';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      stream: {},
      thumbnail: null
    };
  }
  render() {
    let thumbnailView;
    let messageView;
    let shareButton;

    if (this.state.thumbnail) {
      thumbnailView = (
        <Image
          source={{ uri: this.state.thumbnail }}
          resizeMode="contain"
          style={styles.thumbnail}
          ref="thumbnail"
        />
      );
      shareButton = (
        <TouchableOpacity
          style={styles.shareButton}
          onPress={this.share.bind(this)}
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={styles.buttonText}>Share</Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      thumbnailView = (
        <View style={styles.thumbnailPreview} ref="thumbnail">
          <View style={{ justifyContent: 'center', flex: 1 }}>
            <Text style={[styles.buttonText]}>PREVIEW AREA</Text>
          </View>
        </View>
      );

      // サムネイル未取得時はShareボタンをグレーにしてる
      shareButton = (
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: 'gray' }]}
          onPress={this.share.bind(this)}
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={styles.buttonText}>Share</Text>
            <Text style={styles.buttonText}>(Will be enable after FETCH)</Text>
          </View>
        </TouchableOpacity>
      );
    }
    if (this.state.message) {
      messageView = <Text style={styles.buttonText}>{this.state.message}</Text>;
    }
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView style={styles.container} behavior="padding">
          <Text>Input Twitch Username:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={this.state.username}
              onChangeText={val => {
                this.setState({ username: val });
              }}
              onBlur={() => {
                Keyboard.dismiss();
              }}
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.fetchButton}
              onPress={() => {
                Keyboard.dismiss();
                this.fetchTwitchInfo();
              }}
            >
              <View
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={styles.buttonText}>FETCH</Text>
              </View>
            </TouchableOpacity>
          </View>
          {messageView}
          {thumbnailView}

          {shareButton}
        </KeyboardAvoidingView>
      </View>
    );
  }
  fetchTwitchInfo() {
    /*
    stream: {
      average_fps:30
      channel: Object
      created_at: "2017-05-14T06:01:16Z"
      delay: 0
      game: "Music"
      is_playlist: false
      preview: Object // thumbnails
      stream_type: "live"
      video_height: 1080
      viewers: 834
    }
    */
    this.setState({ message: '' });
    axios({
      url: `${Config.API_STREAM}/${this.state.username}`,
      method: 'get',
      headers: {
        Accept: 'application/vnd.twitchtv.v3+json',
        'Client-ID': Config.CLIENT_ID
      }
    })
      .then(response => {
        const stream = response.data.stream;

        if (stream) {
          this.setState({
            stream: stream,
            thumbnail: stream.preview.large,
            title: stream.channel.status,
            message: stream.channel.status
          });
        } else {
          this.setState({
            message: 'ERROR: OFFLINE'
          });
        }
      })
      .catch(err => {
        this.setState({
          message: 'ERROR: NETWORK ERROR'
        });
      });
  }
  share() {
    if (!this.state.thumbnail) {
      this.setState({ message: 'NO THUMBNAIL' });
      return;
    }
    // 描画しているサムネイルをdata-uriに変換してシェアする
    // URLのままだとTwitter公式クライアントの表示でイマイチなので
    axios
      .get(this.state.thumbnail, {
        responseType: 'arraybuffer'
      })
      .then(response => {
        const image = Buffer.from(response.data).toString('base64');
        Share.share(
          {
            message: `${this.state.title}\nhttps://www.twitch.tv/${this.state.username}`,
            url: `data:${response.headers['content-type'].toLowerCase()};base64,${image}`,
            title: 'Share'
          },
          {
            dialogTitle: 'Share',
            excludedActivityTypes: [
              // 以下のような逆ドメイン指定で出したくないアプリを指定できる
              // 'com.apple.UIKit.activity.PostToTwitter'
            ],
            tintColor: 'green'
          }
        );
      });
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'center',
    margin: 10,
    marginTop: Constants.statusBarHeight
  },
  inputContainer: {
    flex: 2,
    flexDirection: 'row'
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    flex: 7
  },
  thumbnail: {
    flex: 8,
    borderRadius: 5,
    marginTop: 10
  },
  fetchButton: {
    flex: 3,
    backgroundColor: '#EEA9A9',
    alignItems: 'center',
    borderRadius: 5,
    marginLeft: 10
  },
  shareButton: {
    flex: 8,
    flexDirection: 'row',
    backgroundColor: '#58B2DC',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10
  },
  thumbnailPreview: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFF8',
    borderRadius: 5,
    marginTop: 10,
    borderWidth: 1
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center'
  }
});

Expo.registerRootComponent(App);

// pages/visitorChat/visitorChat.js
import { upload, wsBaseUrl, getNews, disposeUrl } from '../../utils/upload.js'
import { api } from '../../utils/api/api.js'
const app = getApp()
const HOST = 'https://xstchat.oss-cn-shanghai.aliyuncs.com'
const myaudio = wx.createInnerAudioContext(); 
//心跳对象 
let heartCheck = {
  timeout: 3000,
  timeoutObj: null,
  serverTimeoutObj: null,
  reset: function () {
    clearTimeout(this.timeoutObj);
    clearTimeout(this.serverTimeoutObj);
    return this;
  },
  start: function () {
    this.timeoutObj = setTimeout(() => {
      wx.sendSocketMessage({
        data: "心跳消息",
        success: res => {
          console.log('心跳成功')
        }
      });
      this.serverTimeoutObj = setTimeout(() => {
        wx.closeSocket();
      }, this.timeout);
    }, this.timeout);
  }
};
//引用 表情 模板
var WxEmoji = require('../../utils/WxEmojiView/WxEmojiView.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isShow: true,
    timestart: 0,
    spreakingAnimation: {},//放大动画
    j: 1,//帧动画初始图片
    isSpeaking: false,//是否在录音状态
    typeShow: false,
    emojiTypeShow: false,
    tav: "",
    //消息记录
    records: [],
    scrollTop: 0,
    sendMessage: {},
    userOrServiceId: '',
    limit: 0,
	  message_show:true,//消息栏 显示
    commonLanague:'',//常用语
    currentPage: 0,
    totalPages: 1,
    toScrollId: '',
    videoSrc:'',
  },
  playVideo(e){
    this.setData({
      videoSrc: e.currentTarget.dataset.src
    })
    let videoContext = wx.createVideoContext('myVideo');
    videoContext.requestFullScreen({ direction:0});
    setTimeout(()=>{
      videoContext.play();
    },500)
  },
  btnSetting() {
    wx.navigateTo({
      url: "/pages/chatsetting/chatsetting?id=0"
    })
  },
  gotoCommon() {
    wx.navigateTo({
      url: "/pages/common/common"
    })
  },
  //获取输入框值，动态显示发送按钮
  getTextareaValue(e) {
    this.setData({
      tav: e.detail.value
    })
  },
  toLink(e){
    const url = e.target.dataset.text;
    if (url && url.length) {
      wx.navigateTo({
        url: '/pages/link/link?url=' + encodeURIComponent(url),
      })
    }
  },
  //图片预览
  previewImage(e) {
    console.log(e.currentTarget.dataset.content)
    wx.previewImage({
      current: e.currentTarget.dataset.content, // 当前显示图片的http链接
      urls: [e.currentTarget.dataset.content] // 需要预览的图片http链接列表
    })
  },
  //录音
  startRecord() {
    this.setData({
      isShow: !this.data.isShow
    })
    this.recorderManager = wx.getRecorderManager()
    this.recorderManager.onStart((res) => {
      console.log('recorder start')
    })
    this.recorderManager.onStop((res) => {
      console.log(res.duration)
      if (res.tempFilePath) {
        const time = Math.round(res.duration / 1000)
        if (time < 1) {
          wx.showToast({
            title: '录音时间过短',
            icon: 'none',
            duration: 2000
          })
          return
        }
        upload(res.tempFilePath, 'voice', HOST, this, time)
      }
    })
  },
  start(e){
    console.log('start')
    //开始录音  
    const options = {
      duration: 60000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'mp3',
      frameSize: 50
    }
    this.recorderManager.start(options)
    var timestart = e.timeStamp    
    this.setData({ timestart: timestart })
    if (!this.data.isSpeaking) {
      speaking.call(this);
      this.setData({
        isSpeaking: true
      })
    }
  },
  end(e){
    console.log('end')
    //结束录音  
    this.recorderManager.stop()
    var timestart = this.data.timestart;
    var timeout = e.timeStamp;
    var timeIng = 0;//录音的时长
    timeIng = timeout - timestart;
    if (this.data.isSpeaking) {
      //去除帧动画循环
      clearInterval(this.timer)
      this.setData({
        isSpeaking: false,
        j: 1
      })
    }
    console.log('end', timeIng)
  },
  //播放录音
  audioPlay(e) {
    myaudio.src = e.target.dataset.audiosrc;
    myaudio.play();
  },
  //图片
  selectPicture() {
    const _this = this;
    wx.chooseImage({
      sourceType: ['album'],
      success: function (res) {
        var tempFilePaths = res.tempFilePaths;
        tempFilePaths.forEach((item, index) => {
          upload(item, 'image', HOST, _this)
        })
        _this.setData({
          typeShow: false
        })
      }
    })
  },
  //拍摄
  film() {
    const _this = this;
    wx.chooseImage({
      sourceType: ['camera'],
      success: function (res) {
        var tempFilePaths = res.tempFilePaths
        upload(tempFilePaths[0], 'image', HOST, _this)
        _this.setData({
          typeShow: false
        })
      }
    })
  },
  //视频
  video() {
    const _this = this;
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 59,
      camera: 'back',
      success(res) {
        upload(res.tempFilePath, 'video', HOST, _this)
        _this.setData({
          typeShow: false
        })
      }
    })
  },
  error() {
    wx.showToast({
      title: "设备不支持拍摄功能",
      icon: 'none',
      duration: 2000
    })
  },
  //点击 表情按钮
  face_show(){  
    WxEmoji.bindThis(this);
    this.setData({
      message_show:false
    })
  },
  //表情 模板方法
  wxPreEmojiTap: function (e) {
    var that = this;
    WxEmoji.wxPreEmojiTap(that, e);
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      userOrServiceId: app.globalData.userInfo.serviceId
    })
    //组装发送信息模板
    this.data.sendMessage = { ...{ type: 1, window: 0 } };
    this.data.sendMessage.avatarUrl = app.globalData.avatar;
    this.data.sendMessage.nickName = app.globalData.userInfo.serviceName;
    this.data.sendMessage.userOrServiceId = app.globalData.userInfo.serviceId;
    api.groupPerson.getServiceInformation({})
    .then(res => {
      this.data.sendMessage.role = res.data.role;
    })
    .catch(error => {

    })
    //获取未读消息
    if (options.logId){
      getNews.getNewRecords(0, this.data.userOrServiceId, this, api, options.logId);
      this.setData({
        logId: true
      })
    }else{
      getNews.getNewRecords(0, this.data.userOrServiceId, this, api)
    }
  },
  updataMessages() {
    !this.data.logId&&getNews.getNewRecords(0, this.data.userOrServiceId, this, api)
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.linkSocket();
    console.log(wsBaseUrl)
  },
  onShow:function(){
    //发送常用语
    console.log(111)
    if (this.data.commonLanague) {
      const msg = { ...this.data.sendMessage };;
      msg.msgType = 'text';
      msg.message = this.data.commonLanague;
      wx.sendSocketMessage({
        data: JSON.stringify(msg),
        success: res => {
          this.setData({
            commonLanague:null
          })
        },
        fail: res => {
          wx.showToast({
            title: "服务器异常",
            icon: 'none',
            duration: 1000
          })
        }
      })
    }
  },
  longTap(e) {
    if (this.data.tav == '@') {
      this.setData({
        tav: ''
      })
    }
    const At = '@' + e.target.dataset.name+'  ';
    this.setData({
      tav: this.data.tav + At,
    })
  },
  sendMessage() {
    if (this.data.tav.trim().length) {
      const msg = { ...this.data.sendMessage };;
      msg.msgType = 'text';
      msg.message = this.data.tav;
      wx.sendSocketMessage({
        data: JSON.stringify(msg),
        success: res => {
          this.setData({
            tav: ''
          })
          setTimeout(()=>{
            this.setData({
              tav: ''
            })
          },100)
        },
        fail: res => {
          wx.showToast({
            title: "网络异常",
            icon: 'none',
            duration: 1000
          })
        }
      })
    }
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    wx.closeSocket({
      success: res => {
        this.setData({
          limit: 13
        })
      }
    })
  },
  linkSocket() {
    let that = this
    wx.connectSocket({
      url: `${wsBaseUrl}?type=1&userOrServiceId=${that.data.userOrServiceId}&window=0`,
      // url:'ws://echo.websocket.org',
      // url: `ws://192.168.3.60:9999?type=1&userOrServiceId=${that.data.userOrServiceId}&window=0`,
      success() {
        console.log('连接成功')
        that.initEventHandle()
      }
    })
  },
  initEventHandle() {
    let that = this
    wx.onSocketMessage((res) => {
      //收到消息
      console.log(res.data)
      if (res.data === "心跳消息") {
        heartCheck.reset().start()
      } else {
        console.log('收到服务器内容')
        const msgTemp = JSON.parse(res.data);
        if (msgTemp.msgType === 'text') {
          msgTemp.message = disposeUrl(msgTemp.message);
        } else {
          msgTemp.message = msgTemp.message;
        }
        that.data.records.push(msgTemp)
        that.setData({
          records: that.data.records,
          toScrollId: `scrollId${that.data.records.length - 1}`
        })
      }
    })
    wx.onSocketOpen(() => {
      console.log('WebSocket连接打开')
      heartCheck.reset().start()
    })
    wx.onSocketError((res) => {
      console.log('WebSocket连接打开失败')
      this.reconnect()
    })
    wx.onSocketClose((res) => {
      console.log('WebSocket 已关闭！')
      this.reconnect()
    })
  },
  reconnect() {
    console.log(this.lockReconnect)
    if (this.lockReconnect) return;
    this.lockReconnect = true;
    clearTimeout(this.timer)
    if (this.data.limit < 12) {
      this.timer = setTimeout(() => {
        this.linkSocket();
        this.lockReconnect = false;
      }, 2000);
      this.setData({
        limit: this.data.limit + 1
      })
    }
  }
})
function speaking() {
  //话筒帧动画
  var i = 1;
  this.timer = setInterval(function () {
    i++;
    i = i % 5;
    _this.setData({
      j: i
    })
    return
  }, 200);
  //波纹放大,淡出动画
  var _this = this;
  var animation = wx.createAnimation({
    duration: 1000
  })
  animation.opacity(0).scale(3, 3).step();//修改透明度,放大
  this.setData({
    spreakingAnimation: animation.export()
  })
  setTimeout(function () {
    //波纹放大,淡出动画
    var animation = wx.createAnimation({
      duration: 1000
    })
    animation.opacity(0).scale(3, 3).step();//修改透明度,放大
    _this.setData({
      spreakingAnimation_1: animation.export()
    })
  }, 250)
  setTimeout(function () {
    //波纹放大,淡出动画
    var animation = wx.createAnimation({
      duration: 1000
    })
    animation.opacity(0).scale(3, 3).step();//修改透明度,放大
    _this.setData({
      spreakingAnimation_2: animation.export()
    })
  }, 500)
}
// market/pages/payment_in_advance/payment_in_advance.js
import { api } from '../../../utils/api/api.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    show: false,
    userId: '',//客户id，
    customerName: '',//客户名
    accountName: '',//账户
    accountId: '',//账户类型id
    accountList: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      userId: options.userId,
      customerName: options.name
    })
    this.getAccountList();
  },
  //获取账户列表
  getAccountList(){
    api.market.getAccountList({
      
    }).then(res => {
      if(res.code == 1){
        this.setData({
          accountList: res.datas.accounts,
          accountName: res.datas.accounts[0].account_name,
          accountId: res.datas.accounts[0].account_id
        })
      }
    })
  },
  //收预付款
  getAdvanceCharge(e){
    api.market.getAdvanceCharge({
      user_id: this.data.userId,
      pre_money: e.detail.value.advanceAmount,
      pay_account: this.data.accountId,
      note: e.detail.value.remark,
    }).then(res => {
      if(res.code == 1){
        wx.showToast({
          title: '收款成功',
        })
        setTimeout(() => {
          wx.navigateBack({
            detal: 1
          })
        },1000)
      }
    })
  },
  //显示账户列表
  showSelectAccountModal(){
    this.setData({
      show: true
    })
  },
  //点击换取账户类型
  selectAccountType(e){
    console.log(e.detail)
    this.setData({
      accountName: this.data.accountList[e.detail].account_name,//账户
      accountId: this.data.accountList[e.detail].account_id,//账户类型id
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
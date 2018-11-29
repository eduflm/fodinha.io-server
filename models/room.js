const fs = require('fs')
const _ = require('lodash')

class Room {
  constructor(name, admin){
    this.name = name
    this.admin = admin
    this.inGame = false
    this.players = []
    this.deck = [{"pack":"copas","value":"4","weight":0},{"pack":"espadas","value":"4","weight":0},{"pack":"ouros","value":"4","weight":0},{"pack":"paus","value":"5","weight":1},{"pack":"copas","value":"5","weight":1},{"pack":"espadas","value":"5","weight":1},{"pack":"ouros","value":"5","weight":1},{"pack":"paus","value":"6","weight":2},{"pack":"copas","value":"6","weight":2},{"pack":"espadas","value":"6","weight":2},{"pack":"ouros","value":"6","weight":2},{"pack":"paus","value":"7","weight":3},{"pack":"espadas","value":"7","weight":3},{"pack":"paus","value":"Q","weight":4},{"pack":"copas","value":"Q","weight":4},{"pack":"espadas","value":"Q","weight":4},{"pack":"ouros","value":"Q","weight":4},{"pack":"paus","value":"J","weight":5},{"pack":"copas","value":"J","weight":5},{"pack":"espadas","value":"J","weight":5},{"pack":"ouros","value":"J","weight":5},{"pack":"paus","value":"K","weight":6},{"pack":"copas","value":"K","weight":6},{"pack":"espadas","value":"K","weight":6},{"pack":"ouros","value":"K","weight":6},{"pack":"paus","value":"A","weight":7},{"pack":"copas","value":"A","weight":7},{"pack":"ouros","value":"A","weight":7},{"pack":"paus","value":"2","weight":8},{"pack":"copas","value":"2","weight":8},{"pack":"espadas","value":"2","weight":8},{"pack":"ouros","value":"2","weight":8},{"pack":"paus","value":"3","weight":9},{"pack":"copas","value":"3","weight":9},{"pack":"espadas","value":"3","weight":9},{"pack":"ouros","value":"3","weight":9},{"pack":"ouros","value":"7","weight":10},{"pack":"espadas","value":"A","weight":11},{"pack":"copas","value":"7","weight":12},{"pack":"paus","value":"4","weight":13}]
    this.turn = 0 //index
    this.currentRound = 0
    this.rounds = [[]]
    this.winner = null // index
  }

  addPlayer(id){
    this.players.push(id)
  }

  getPlayer(id){
    return new Promise((resolve, reject) => {
      this.players.forEach((player, index) => {
        if (player.id === id){
          resolve(index)
        }
      })
    })
  }

  removePlayer(id, callback){
    this.players = this.players.filter((player) => player.id !== id)
    if (this.players.length <= 0){
      callback()
    }
  }

  playersReadyToStart(){
    var playersReady = this.players.filter((player) => player.ready !== true)
    if (this.players.length > 1 && playersReady.length === 0){
      return true
    }
    return false
  }

  distributeCards(){
    return new Promise((resolve, reject) => {
      this.players.forEach((player, index) => {
        var cards = []
        for (var i = 0; i < 4; i++){
          var randomIndex = (Math.floor(Math.random() * this.deck.length))
          cards.push(this.deck[randomIndex])
          this.deck.splice(randomIndex, 1)
        }
        this.players[index].cards = cards
      })
      resolve()
    })
  }

  beginMatch(){
    return new Promise((resolve, reject) => {
      if (this.playersReadyToStart()){
        this.inGame = true
        this.distributeCards().then(() => {
          resolve()
        })
      } else {
        reject()
      }
    })
  }

  playerIsReady(id, ready){
    this.players.forEach((player, index)=> {
      if (player.id === id){
        this.players[index].ready = ready
        return
      }
    });
  }

  removeCard(card, id){
    var objNormalized = {pack: card.pack, value: card.value, weight: parseInt(card.weight)}
    return new Promise ((resolve, reject) => {
      this.getPlayer(id).then((index) => {
        this.players[index].cards.forEach((playerCard, indexCard) => {
          if (_.isEqual(objNormalized, playerCard)){
            this.players[index].cards.splice(indexCard, 1)
            console.log("card removed!")
            resolve()
          }
        })
      })
    })
  }

  recievePlay(card, playerId){
    return new Promise ((resolve, reject) => {
      var obj = {"pack" : card.pack, "value" : card.value, "weight" : card.weight, player: playerId}
      this.rounds[this.currentRound].push(obj)
      this.changeTurn().then((turn) => {
        this.removeCard(card, playerId).then(() => {
          resolve()
        })
      })
    })
  }

  changeRound(){
    this.rounds.push([])
    this.currentRound += 1
  }

  changeTurn(){
    return new Promise((resolve, reject) => {
      if (this.turn === this.players.length - 1){  
        console.log("Entrou no if")
        this.verifyWinnerOfRound().then(() => {
          console.log("ROUND CHANGED")
          this.changeRound()
          this.turn = 0
        })
      } else {
        this.turn += 1
      }
      resolve(this.turn)
    })
  }

  giveAPointTo(id){
    return new Promise((resolve,reject) => {
      this.getPlayer(id).then((index) => {
        this.players[index].points += 1
        resolve()
      })
    })
  }

  verifyWinnerOfRound(){
    return new Promise((resolve, reject) => {
      var round = this.rounds[this.currentRound]
      round.sort((a, b) => {
        return a.weight - b.weight
      })
      this.giveAPointTo(round[round.length - 1].player).then(() => {
        this.winner = round[round.length - 1].player
        console.log("POINT GIVEN TO " + round[round.length - 1].player)
      })
      resolve()
    })
  }

  announceWinner(){
    return new Promise((resolve, reject) => {
      if (this.winner !== null){
        console.log("Tem vencedor")
        this.getPlayer(this.winner).then((playerIndex) => {
          console.log("vai devolver o vencedor" + this.players[playerIndex])
          this.winner = null
          resolve(this.players[playerIndex])
        })
      } else {
        console.log("reject")
        reject()
      }
    })
  }
  
  currentTurn(){
    return this.players[this.turn]
  }

  getPlayers(){
    return this.players
  }

  cardsLoadedToPlayer(id) {
    var canStart = false
    return new Promise((resolve, reject) => {
      this.getPlayer(id).then((index) => {
        this.players[index].cardsLoaded = true
      })
      this.players.forEach((player) => {
        console.log(this.players)
        if (player.cardsLoaded === false){
          reject("Erro")
        }
      })
      console.log("foi")
      resolve()
    })

  }
}

module.exports = {Room}
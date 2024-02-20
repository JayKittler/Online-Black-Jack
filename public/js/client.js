

const socket = io()
const players = {}

let dealer_hand = ['','']

let players_move = ''

socket.on('updatePlayers', (backendPlayers) =>{
    for (const id in backendPlayers){
        const backendPlayer = backendPlayers[id]
        if(backendPlayers.seat == "Spectate"){
            alert("The game is currently full, You can spectate till people leave")
            break
        }

        if(!players[id]){
            players[id] = new Player(backendPlayer.username, backendPlayer.seat, backendPlayer.hand,backendPlayer.wager, backendPlayer.balance)
        }else{
            
            cur_seat = "Seat_"+ (players[id].seat+1);
            
            document.getElementById(cur_seat+"_name").innerHTML = players[id].username
            document.getElementById(cur_seat+"_balance").innerHTML = "$" + players[id].balance
            
            document.getElementById(cur_seat+"_card1").src = './imgs/' + players[id].hand[0]+'.png'
            document.getElementById(cur_seat+"_card2").src = './imgs/' + players[id].hand[1]+'.png'
            
        }
    }
        
    
    for(const id in players){
        if(!backendPlayers[id]){
            document.getElementById(players[id].seat+1).innerHTML = "EMPTY"
            delete players[id]
        }
    }
})


function usernameSubmit(form){
    document.getElementById("login_popup").style.display = "none"
    let username = form.userName.value
    let uniqueID = form.uniqueID.value
    
    socket.emit("updated_username", username, uniqueID)
}

socket.on('updateHands', (backendPlayers, backend_dealer_hand) =>{
    if(dealer_hand[1] != backend_dealer_hand[1]){
        document.getElementById("dealer_card2").src = 'imgs/back_card.png'
        dealer_hand = backend_dealer_hand
    }
    document.getElementById("dealer_card1").src = '/imgs/' + backend_dealer_hand[0] + '.png'
    for (const id in backendPlayers){
        players[id].hand = backendPlayers[id].hand;
        let card_num = 0;
        for(const card in players[id].hand){
            document.getElementById("Seat_" + (players[id].seat+1)+"_card"+(card_num+1)).src = './imgs/' + players[id].hand[card_num]+'.png'
            card_num++
        }
    }
})

function deal(){
    dealer_hand = ['blank', 'blank']
    for(const id in players){
        
        players[id].hand = ['blank', 'blank', 'blank', 'blank', 'blank']
        for(let i = 0; i < players[id].hand.length; i++){
            console.log(players[id])
            console.log(players[id].seat+"_card"+(i+1))
            document.getElementById("Seat_"+(players[id].seat+1)+"_card"+(i+1)).src = './imgs/' + players[id].hand[i]+'.png'
        }
        document.getElementById("dealer_card1").src = './imgs/blank.png'
        document.getElementById("dealer_card2").src = './imgs/blank.png'
    }
    socket.emit('deal')
}

function player_action(move){
    if(players[socket.id].hand.length >= 5){
        player_win(socket.id)
        return
    }
    socket.emit('player_action', socket.id, move)
}

function player_win(player_id){
    players[player_id].balance += players[player_id].wager
}

class Player{
    constructor(username, seat, hand, balance, uniqueID){
        this.username = username
        this.seat = seat
        this.hand = hand
        this.balance = balance
        this.uniqueID = uniqueID
    }
}



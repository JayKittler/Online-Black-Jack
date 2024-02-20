const express = require('express')
const app = express();
const port = 3000;

const http = require('http');
const { start } = require('repl');
const server = http.createServer(app);

const {Server} = require('socket.io');
const io = new Server(server);

//for saving player data
const fs = require('fs');
const uniqueID_data = JSON.parse(fs.readFileSync('./player_data.json'));

app.use(express.static('public'));

app.get('/', (req, res) =>{
    res.sendFile(__dirname + '/public/index.html');
})

const players = {

}


const seats = [-1, -1, -1, -1, -1];

//Game variables

//All possible cards
const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
//All possible suits
const suits = ["Hearts", "Diamonds", "Spades", "Clubs"];
//dealer hand
let dealer_hand = ['blank','blank'];
//returns an open seat or spectate if none
function find_open_seat(id){
    for(let i = 0; seats.length; i++){
        if(seats[i] == -1){
            seats[i] = id;
            return i;
        }
    }
    return "Spectate";
}

io.on('connection', (socket) =>{
    //Add player to players 
    let player_seat = -1;
    //When a user has enter a username and uniqueID
    socket.on("updated_username", (username, uniqueID) =>{
        
        //If not already a player
        if(!players[socket.id]){
            let starting_balance = 100;
            //find an open seat
            player_seat = find_open_seat(socket.id);
            if(uniqueID_data.hasOwnProperty(uniqueID)){
                //If the person has a id give them there balance
                starting_balance = uniqueID_data[uniqueID];
            }
            //create a player object in players
            players[socket.id] = {
                "username" : username,
                "seat" : player_seat,
                "hand" : ['blank', 'blank'],
                "wager" : 0,
                "balance" : starting_balance,
                "uniqueID" : uniqueID
            }
            //send to client to be updated
            io.emit('updatePlayers', players);
        }

        io.emit('updatePlayers', players);
        setTimeout(() =>{
            io.emit("draw_players");
        }, 100);
    });

    socket.on('disconnect', (reason) =>{
        //Save data if a unique id was entered
        if(players[socket.id] && players[socket.id].uniqueID !== -1){
            const uniqueID = players[socket.id].uniqueID;
            if(!uniqueID_data.hasOwnProperty(uniqueID))uniqueID_data[uniqueID] = players[socket.id].balance;
            else uniqueID_data[uniqueID] = players[socket.id].balance;

            fs.writeFileSync('player_data.json', JSON.stringify(uniqueID_data,null,2), (err) =>{
                if (err) throw err;
            });
        }
        
        //Delete player from that seat
        seats[player_seat] = -1;
        //Delete from players
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });


    //Game functions here down

    //Dealing
    
    /*
    thought process:
    1. Want to itterate through players playing and add one card to hand
    2. add dealer face down card
    3. repeat #1
    4. Dealer up card
    */
   socket.on('deal', ()=>{
    dealer_hand[0] = ['blank'];
    dealer_hand[1] = ['blank'];


   });
    socket.on('deal', () =>{
        delay_multiplyer = 1;
        dealer_hand[0] = ['blank']
        dealer_hand[1] = ['blank']


        for(let i = 0; i < seats.length; i++){
            if(seats[i] != -1){
                delay_multiplyer++
                players[seats[i]].hand = ['blank', 'blank']
                setTimeout(() =>{
                    players[seats[i]].hand[0] = getCard()
                    io.emit('updateHands', players, dealer_hand)
                }, 500 * delay_multiplyer)
            }
        }
        delay_multiplyer++
        setTimeout(()=>{
            dealer_hand[0] = getCard()
            io.emit('updateHands', players, dealer_hand)
        }, 500 * delay_multiplyer)

        for(let i = 0; i < seats.length; i++){
            if(seats[i] != -1){
                delay_multiplyer++
                setTimeout(() =>{
                    players[seats[i]].hand[1] = getCard()
                    io.emit('updateHands', players, dealer_hand)
                }, 500 * delay_multiplyer)
            }
        }
        delay_multiplyer++
        setTimeout(()=>{
            dealer_hand[1] = getCard()
            io.emit('updateHands', players, dealer_hand)
        }, 500 * delay_multiplyer)

    });

    socket.on('player_action', (player_id, move) =>{
        if(move == "Hit"){
            players[player_id].hand.push(getCard());
            console.log(players[player_id].hand);
            io.emit('updateHands', players, dealer_hand);
        }
    });
});

//helper functions

//Function to get a card
function getCard(){
    return cards[Math.floor(Math.random() * 13)] + suits[Math.floor(Math.random() * 4)];
}

server.listen(port, () =>{
    console.log(`Example app listeing on port ${port}`);
});
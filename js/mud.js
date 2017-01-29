// TODO make initialize mud function that sends out the initial text to #mud-output

// TODO scan in rooms upon initialization and create map in memory

// TODO scan in commands and create hash. There'll be many cases in which they don't fit

// TODO Await input from #mud-input

MudOutput = $('#mud-output');
MudInput = $('#mud-input');
GitHubPage = "https://raw.githubusercontent.com/aderbedr/aderbedr.github.io/master/";

Rooms = null;

CurrentRoom = null;
Maps = [];

InvalidCommandResponses = [
   "That is not a valid command.",
   "I do not know what you mean.",
   "Please try another command.",
   "What are you trying to do? Type HELP for assistance."
   ];

function InitializeMud(){
   MudOutput.height($('#intro').height() - 31);
   
   var initialText = "Welcome to my 'MUD'. Unfortunately, since GitHub does not support server side code, it is more of a SUD- Single User Dungeon! If you are new to MUDs, commands should be entered in the input and should be of the form that you would do. For instance, if you wanted to wave at someone, you would type 'wave'. If you wanted to go east, you would type 'east'. If at any time, you are stuck, type HELP and a list of possible commands will come up.<br/><br/>Please enter a name by which you will be called:";
   
   SendToOutput(initialText);

   currentStep = 0;

   $('#mud-input-form').submit(HandleInput);
   
   $.get(GitHubPage + 'MUD/rooms.json', function( data ) {
       Rooms = jQuery.parseJSON(data).rooms;
       CurrentRoom = Rooms[0];
       LoadMaps(Rooms);
    });
}

function LoadMaps(Rooms){
   var highestLevel = 0;
   for (var roomIdx in Rooms){
      var room = Rooms[roomIdx];
      if (room.zcoord > highestLevel){
         highestLevel = room.zcoord;
      }
      if (Maps[room.map] == undefined){
         Maps[room.map] = [];
      }
   }
   for (var map in Maps){
      for (level = 0; level <= highestLevel; level++){
         GetMap(map, level);
      }
   }
   
}
function GetMap(map, level){
   $.get(GitHubPage + 'MUD/' + map + '_map_' + level, function(data) {
      Maps[map].push(data.split("\n"))
   });
}

function SendToOutput(text, monospace){
   MudOutput.append("<br/>");
   if (monospace){
      MudOutput.append("<span class='monospace'>" + text + "</span>");
   } else {
      MudOutput.append("<span>" + text + "</span>");
   }
   MudOutput.append("<br/>");
   MudOutput.append("\>");
   var outputDiv = document.getElementById("mud-output");
   outputDiv.scrollTop = outputDiv.scrollHeight;
}

function HandleInput(e){
   try {
      text = MudInput.val();
      event.preventDefault();
      MudInput.val("");
      
      var splitUpWords = text.split(' ');
      
      MudOutput.append("<span class='output-text'>" + text + "</span>");
      var outputDiv = document.getElementById("mud-output");
      outputDiv.scrollTop = outputDiv.scrollHeight;
      
      var firstWord = splitUpWords[0].toLowerCase();
      
      if (currentStep === 0){
         // They are choosing a name. Get the first word.
         PlayerSetName(firstWord);
         currentStep++;
         return;
      }
      // Are they certain unique commands?
      var direction = ParseDirection(firstWord);
      if (firstWord == "look" || firstWord == "l"){
         DisplayRoom(CurrentRoom);
         return;
      } else if (direction != null) {
         var newRoom = Movement(CurrentRoom, direction);
         if (newRoom != null){
            CurrentRoom = newRoom;
            SendToOutput("You walk " + direction + ".");
            DisplayRoom(CurrentRoom);
         } else {
            SendToOutput("You cannot head in that direction.");
         }
         return;
      } else if (firstWord == "map"){
         Map(CurrentRoom);
         return;
      } else if (firstWord == "enter" && splitUpWords[1].toLowerCase() == "teleporter" && Teleport(CurrentRoom)){
         return;
      } else if (firstWord == "help"){
         Help();
      } else {
         var confusedCommandIndex = Math.floor(Math.random() * InvalidCommandResponses.length);
         SendToOutput(InvalidCommandResponses[confusedCommandIndex]);
      }
   } catch (ex){
      SendToOutput("There was an error executing this command. Please try something else.");
   }
}

function ParseDirection(dir){
   switch (dir){
      case "east":
      case "e":
         return "east";
      case "west":
      case "w":
         return "west";
      case "up":
      case "u":
         return "up";
      case "down":
      case "d":
         return "down";
      case "north":
      case "n":
         return "north";
      case "south":
      case "s":
         return "south";
      case "northeast":
      case "ne":
         return "northeast";
      case "northwest":
      case "nw":
         return "northwest";
      case "southeast":
      case "se":
         return "southeast";
      case "southwest":
      case "sw":
         return "southwest";
      default:
         return null;
   }
}

function PlayerSetName(name){
   name = Propercase(name);
    
   SendToOutput("You have chosen the name: " + name + ".");
   
   SendDelayedOutput("The world around begins to clear, as if a veil were lifted off your eyes. You find yourself on the lawn of the University of Maryland. As you reach up to rub your eyes, you realize crumpled in the palm of your hand is a note that simply reads, 'Amanda Der Bedrosian'. Curious as to the meaning, you set off on your quest to learn more.", 1500);
   
   SendDelayedOutput("Helpful hints may contain commands, which will be denoted by all capital letters such as LOOK. To move around the area, type directions, such as EAST, WEST, NORTHEAST or UP.", 3000);
}

function SendDelayedOutput(text, delay){
   window.setTimeout(function(){SendToOutput(text)}, delay) 
}

// Commands

function Map(currentRoom){
   // Get the five lines above it
   map ="";
   for (y = currentRoom.ycoord - 5; y < currentRoom.ycoord + 5; y++){
      if (y == currentRoom.ycoord){
         var line = Maps[currentRoom.map][currentRoom.zcoord][y].substring(currentRoom.xcoord - 10, currentRoom.xcoord);
         line += "<span style='color:red;font-weight:bold;'>X</span>";
         line += Maps[currentRoom.map][currentRoom.zcoord][y].substring(currentRoom.xcoord + 1, currentRoom.xcoord + 10);
         map += line;
      } else {
         map += Maps[currentRoom.map][currentRoom.zcoord][y].substring(currentRoom.xcoord - 10, currentRoom.xcoord + 10);
      }
      map += "<br/>";
   }
   SendToOutput(map, true);
}

function Teleport(currentRoom){
   if (currentRoom.teleport_to == undefined){
      return false;
   }
   SendToOutput("As you enter the teleporter, you feel your vision blur as you're sent to another place and time. Slowly, you get your bearings and look around.");
   CurrentRoom = FindRoom(currentRoom.teleport_to);
   DisplayRoom(CurrentRoom);
   return true;
}

function Help(){
   var line = "Welcome to aMUnDa, a very bare-bones MUD (or better called SUD- single user dungeon) designed after my non-personal life. Use compass directions (North, northeast, south, etc) to navigate. Almost each room of the SUD is meant to convey something I have worked on or have been a part of, ranging from courses I've taken in college to projects at work. While it may come off as odd to make a SUD around my life, I programmed for MUDs for years and wanted to convey that as part of my professional website.<br/>";
   line += "Some helpful commands:<br/>";
   line += "MAP<br/>";
   line += "LOOK<br/>";
   line += "NORTH/NORTHEAST/EAST/SOUTHEAST/SOUTH/SOUTHWEST/WEST/NORTHWEST/UP/DOWN<br/>";
   line += "ENTER TELEPORTER (only when in the teleporter room)<br/>";
   SendToOutput(line);
}
// Helpers
function Movement(currentRoom, direction){
   //direction = Propercase(direction);
   var prospectiveRoom = currentRoom.exits[direction];
   return (prospectiveRoom != null) ? FindRoom(prospectiveRoom) : null;
}
function FindRoom(roomName){
   var foundRoom = null;
   Rooms.forEach(function(element, index, array){
      if (element.roomId == roomName){
         foundRoom = element;
      }
   }, foundRoom);
   return foundRoom;
}

function DisplayRoom(currentRoom){
   var roomText = "<span class='room-name'>" + currentRoom.shortDesc + "</span><br/>";
   if (currentRoom.longDesc != ""){
      roomText += "<span class='room-desc'>" + currentRoom.longDesc + "</span><br/>";
   }
   roomText += "<span>From here, you can head "
   
   // List exits
   var exits = Object.keys(CurrentRoom.exits);
   if (exits.length == 1){
      roomText += exits[0];
   } else if (exits.length > 1) {
      roomText += exits.slice(0, exits.length - 1).join(", ");
      roomText += " and " + exits[exits.length - 1];
   }
   
   roomText += ".";
   
   SendToOutput(roomText);
}

function Propercase(word){
   var copy = word.substring(1).toLowerCase();
   return word[0].toUpperCase() + copy;
}



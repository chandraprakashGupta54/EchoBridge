const userBtn = document.getElementById("userButton");
  const ngoBtn = document.getElementById("ngoButton");
  const heading = document.getElementById("head");
 
  var usesfun= function(){
    heading.textContent = "USER LOGIN";
  }
  userBtn.addEventListener("click",usesfun );

    var ngofun= function(){
   heading.textContent = "NGO LOGIN";
  }
  ngoBtn.addEventListener("click",ngofun);
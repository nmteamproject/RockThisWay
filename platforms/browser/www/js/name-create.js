document.getElementById("username").addEventListener("input", function(){
    localStorage.user = document.getElementById("username").value
});
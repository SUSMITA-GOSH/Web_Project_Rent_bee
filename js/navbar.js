(function(){
  function getUserInitial(email){
    if(!email) return "";
    const signupLink = document.getElementById("navSignupLink");
if (signupLink) signupLink.style.display = "none";

    return email.trim().charAt(0).toUpperCase();
  }

  function buildProfileElement(email){
    const li = document.createElement("li");
    li.className = "nav-item";
    li.id = "navProfileItem";
    const initial = getUserInitial(email);
    li.innerHTML = `<a href="profile.html" class="nav-link p-0" title="${email}"><span class="profileIcon">${initial}</span></a>`;
    return li;
  }

  function setLoggedInUI(email){
    const loginLink = document.getElementById("navLoginLink");
    const navRight = document.querySelector("#mainNav") || document.querySelector(".navbar-nav");

    if(!loginLink) return;

    loginLink.textContent = "Logout";
    loginLink.href = "#";
    loginLink.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userEmail");
      window.location.reload();
    };

    if(!document.getElementById("navProfileItem")){
      const profileEl = buildProfileElement(email);
      // append to the left nav (mainNav) so it appears with other links
      const mainNav = document.getElementById("mainNav");
      if(mainNav) mainNav.appendChild(profileEl);
      else if(navRight) navRight.appendChild(profileEl);
    }
  }

  function setLoggedOutUI(){
    const loginLink = document.getElementById("navLoginLink");
    const profileItem = document.getElementById("navProfileItem");
    if(loginLink){
      loginLink.textContent = "Login";
      loginLink.href = "login.html";
      loginLink.onclick = null;
    }
    if(profileItem && profileItem.parentNode) profileItem.parentNode.removeChild(profileItem);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userEmail = localStorage.getItem("userEmail");
    if(isLoggedIn === "true" && userEmail){
      setLoggedInUI(userEmail);
    } else {
      setLoggedOutUI();
    }
  });
})();

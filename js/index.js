document.addEventListener("DOMContentLoaded", () => {
    const dropdowns = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropdowns);

    const currentUser = { displayName: "User" };

    const userAuthSection = document.getElementById("user-auth-section");
    const userContributions = document.getElementById("cont-link");
    const logoutBtn = document.getElementById("logout-button");

    if (currentUser) {
        if (userAuthSection){
            userAuthSection.innerHTML = `<span>Hello, ${currentUser.displayName}</span>`;
            logoutBtn.innerHTML = `<a>Logout</a>`;
        }
        if (userContributions) {
            userContributions.innerHTML = `<a href="contributions.html">Contributions</a>`
        }
    } else {
        if (userAuthSection) {
            userAuthSection.innerHTML = `
                    <a href="login.html">Log In</a>
                    <a href="signup.html">Sign Up</a>
                `;
        }

    }
});
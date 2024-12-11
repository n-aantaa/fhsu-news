document.addEventListener("DOMContentLoaded", () => {
    const dropdowns = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropdowns);

    const currentUser = { displayName: "John Doe" }; // Set to null if user is not logged in
    // const currentUser = null;

    const userAuthSection = document.getElementById("user-auth-section");
    const userContributions = document.getElementById("cont-link");

    if (currentUser) {
        userAuthSection.innerHTML = `<span>Hello, ${currentUser.displayName}</span>`;
        userContributions.innerHTML = `<a href="contributions.html">Contributions</a>`
    } else {
        userAuthSection.innerHTML = `
                    <a href="login.html">Log In</a>
                    <a href="signup.html">Sign Up</a>
                `;
    }
});
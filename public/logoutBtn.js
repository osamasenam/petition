const logoutBtn = $("#logoutBtn");

logoutBtn.on("click", () => {
    req.session.userId = undefined;
})
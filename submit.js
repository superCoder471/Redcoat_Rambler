// submit.js
const ideaForm = document.getElementById('idea-form');

ideaForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Gather form data
  const submission = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    category: document.getElementById('category').value,
    idea: document.getElementById('idea').value
  };

  try {
    // Send data to the backend API
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission)
    });

    if (response.ok) {
      alert("✅ Your idea has been sent to the editors!");
      ideaForm.reset();
    } else {
      const errorText = await response.text();
      alert("❌ Failed to send idea: " + errorText);
    }
  } catch (error) {
    console.error("Submission error:", error);
    alert("❌ An error occurred. Please check your connection.");
  }
});
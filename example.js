// Example file with some issues for Gemini to review

function getUser(id) {
  const user = db.find(id);
  return user?.name;
}

async function saveData(data) {
  const result = await api.post(data);
  return result;
}

function sum(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}

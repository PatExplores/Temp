import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-auth.js";
import { getDatabase, set, ref, update, onValue, child, get } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAvkgRVng7pyUF3WvVtxXxHrAql2QTxL8",
  authDomain: "fir-prjct-6431b.firebaseapp.com",
  projectId: "fir-prjct-6431b",
  storageBucket: "fir-prjct-6431b.appspot.com",
  messagingSenderId: "569727461690",
  appId: "1:569727461690:web:0ebd710c21c045d6418803"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase(app);

const player = document.getElementById('player');
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const aiscan = new Event("aiscan");
const description = document.getElementById("prediction-overlay");
const predictagain = document.getElementById("predictbtn");
var userList = [];
const dbRef = ref(database, 'employees/');
var labeledFaceDescriptors = undefined
var intervalID;

async function preloadLabeledImages() {
  labeledFaceDescriptors = await loadLabeledImages()
  labeledFaceDescriptors = labeledFaceDescriptors.filter(x => x != null)
}

let imageCapture;

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(fetchUsers);

function fetchUsers() {
  const promise1 = new Promise((resolve, reject) => {
    onValue(dbRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        userList.push(childSnapshot.key);
      });
      resolve();
    }, {
      onlyOnce: true
    })
  });
  Promise.all([promise1]).then(preloadLabeledImages);
}

const constraints = {
  audio: false,
  video: {
    facingMode: 'user'
  }
};

predictagain.addEventListener('click', () => {
  startLookingAgain();
});

player.addEventListener('aiscan', () => {
  imageCapture.grabFrame()
    .then((imageBitmap) => {
      player.pause();
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
      predictImage(canvas);
    })
});

function loadCamera() {
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    player.srcObject = stream;
    const track = stream.getVideoTracks()[0];
    imageCapture = new ImageCapture(track);
    intervalID = setInterval(startLookingAgain, 2000);
  });
}

const box = document.getElementsByClassName('loader')[0];
box.style.visibility = 'hidden';
loadCamera()

function startLookingAgain() {
  if (labeledFaceDescriptors) {
    if (intervalID) {
      clearInterval(intervalID);
      intervalID = undefined
      player.dispatchEvent(aiscan);
    } else {
      player.play();
      setTimeout(() => {
        displayDescription({ label: "Looking for match..." })
        player.dispatchEvent(aiscan);
      }, 1500);
    }
  }
}

function stopLooking() {
  const box = document.getElementsByClassName('flex-container')[0];
  box.style.visibility = 'visible';
}

function displayDescription(result) {
  stopLooking();
  console.log("result found=" + result.label)
  if (!result.label.includes("oops") && !result.label.includes("Looking")) {
    console.log("result found=" + result.label)
    onValue(ref(database, '/employees/' + result.label), (snapshot) => {
      var userData = JSON.parse(JSON.stringify(snapshot));
      let businessCard = "Name: " + userData['name']
      businessCard += "\n" + "Role: " + userData['role']
      businessCard += "\n" + "Phone: " + userData['phone']
      businessCard += "\n" + "Email: " + userData['email']
      description.innerText = businessCard;
    }, {
      onlyOnce: true
    });
  } else {
    description.innerText = result.label;
  }
}

async function predictImage(canvas) {
  let found = false;
  const blbImage = dataURLtoBlob(canvas.toDataURL('image/png'));
  let image = await faceapi.bufferToImage(blbImage)
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  const displaySize = { width: canvas.width, height: canvas.height }
  faceapi.matchDimensions(canvas, displaySize)
  const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
  const resizedDetections = faceapi.resizeResults(detections, displaySize)
  const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
  results.forEach((result, i) => {
    if (!result.label.includes("unknown")) {
      displayDescription(result)
      found = true;
    }
    console.log("found match name = " + result.label + " match %=" + Math.round(result.distance * 100))
  })
  if (results.length == 0) {
    displayDescription({ label: "oops, no match found!" })
  }
  if (!found) {
    startLookingAgain();
  }
}

async function loadLabeledImages() {
  return Promise.all(
    userList.map(async label => {
      const descriptions = []
      try {
        for (let i = 1; i <= 1; i++) {
          const link = `https://raw.githubusercontent.com/sunumuk/virtualbusinesscard/master/images/${label}/${i}.jpg`
          const img = await faceapi.fetchImage(link)
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
          descriptions.push(detections.descriptor)
        }
      }
      catch {
        return null
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}

function dataURLtoBlob(dataURL) {
  let array, binary, i, len;
  binary = atob(dataURL.split(',')[1]);
  array = [];
  i = 0;
  len = binary.length;
  while (i < len) {
    array.push(binary.charCodeAt(i));
    i++;
  }
  return new Blob([new Uint8Array(array)], {
    type: 'image/png'
  });
};

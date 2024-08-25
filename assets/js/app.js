const cl = console.log;

const moviecontainer = document.getElementById("moviecontainer");
const backdrop = document.getElementById("backdrop");
const moviemodel = document.getElementById("moviemodel");
const movieform = document.getElementById("movieform");
const titleControl = document.getElementById("title");
const contentControl = document.getElementById("content");
const ratingControl = document.getElementById("movierating");
const bannerfile = document.getElementById("bannerfile");
const bannerImg = document.getElementById("bannerImg");
const submitbtn = document.getElementById("submitbtn");
const updatebtn = document.getElementById("updatebtn");
const movieclose = [...document.querySelectorAll(".movieclose")];
const loader = document.getElementById("loader");
const addmoviebtn = document.getElementById("addmoviebtn");

const BASE_URL = `https://file-type-f0e42-default-rtdb.asia-southeast1.firebasedatabase.app`;

const MOVIE_URL = `${BASE_URL}/movie.json`;

let movieArr = [];

const sweetalert = (msg, iconstr) => {
  swal.fire({
    title: msg,
    timer: 2500,
    icon: iconstr,
  });
};

const togglemodelDrop = () => {
  backdrop.classList.toggle(`visible`);
  moviemodel.classList.toggle(`visible`);
  submitbtn.classList.remove(`d-none`);
  updatebtn.classList.add(`d-none`);

  movieform.reset();
};

movieclose.forEach((btn) => {
  btn.addEventListener("click", togglemodelDrop);
});

const createmoviecards = (arr) => {
  let result = " ";
  arr.forEach((movie) => {
    result += `<div class="col-md-4 mb-4 mb-md-0">
          <div class="card mb-4 moviecard" id="${movie.id}">
            
            <figure class="m-0">
              <img src=${movie.movieurl ? movie.movieurl.baseurl : " "} alt="">
              <figcaption>
                <div class="figcapinfo>">
                  <h3>${movie.title}</h3>
                  <strong>Rating:${movie.movierating}/5</strong>
                  <p>${movie.content}</p>
                </div>
                <div class="d-flex justify-content-between">
                  <button class="btn btn-primary"onclick = "onEditMovie(this)">Edit</button>
                  <button class="btn btn-danger" onclick = "onRemoveMovie(this)">Remove</button>
                </div>
              </figcaption>
            </figure>
          </div>
        
      </div>`;
  });
  moviecontainer.innerHTML = result;
};

const makeApiCall = (MethodName, api_url, msgBody) => {
  loader.classList.remove(`d-none`);

  msgBody = msgBody ? JSON.stringify(msgBody) : null;

  return fetch(api_url, {
    method: MethodName,
    body: msgBody,
    headers: {
      token: "taken from local storage",
    },
  }).then((res) => {
    return res.json();
  });
};

const onBannerfilechange = (fileControl) => {
  cl(`file changes`, fileControl.target.files);
  return new Promise((resolve, reject) => {
    let selectedfiles = fileControl.target.files[0];

    if (selectedfiles) {
      let reader = new FileReader();

      reader.onload = (e) => {
        cl(e.target.result);
        let bannerImginfo = {
          title: selectedfiles.name,
          type: selectedfiles.type,
          baseurl: e.target.result, //base64
          size: selectedfiles.size,
          timestamp: Date.now(),
        };

        resolve(bannerImginfo);
      };

      reader.readAsDataURL(selectedfiles);
    } else {
      reject(new Error(`No file`));
    }
  });
};

const fetchmovies = async () => {
  let movieobj = await makeApiCall("GET", MOVIE_URL);
  cl(movieobj);

  let movieArr = [];

  for (const key in movieobj) {
    movieArr.push({ ...movieobj[key], id: key });
  }

  createmoviecards(movieArr);
  loader.classList.add(`d-none`);
};

fetchmovies();

const onAddMovie = async (eve) => {
  eve.preventDefault();

  let getbanner = bannerfile.files.length
    ? await onBannerfilechange({ target: bannerfile })
    : null;

  let newmovieobj = {
    title: titleControl.value,
    content: contentControl.value,
    movierating: ratingControl.value,
    movieurl: getbanner,
  };
  cl(newmovieobj);

  try {
    let res = await makeApiCall("POST", MOVIE_URL, newmovieobj);

    //callback fun

    newmovieobj.id = res.name;
    let div = document.createElement("div");
    div.className = `col-md-4 mb-4 mb-md-0`;
    div.innerHTML = `<div class="card mb-4 moviecard" id="${newmovieobj.id}">
            
            <figure class="m-0">
              <img src=${
                newmovieobj.movieurl ? newmovieobj.movieurl.baseurl : " "
              } alt="">
              <figcaption>
                <div class="figcapinfo>">
                  <h3>${newmovieobj.title}</h3>
                  <strong>Rating:${newmovieobj.movierating}/5</strong>
                  <p>${newmovieobj.content}</p>
                </div>
                <div class="d-flex justify-content-between">
                  <button class="btn btn-primary"  onclick = "onEditMovie(this)">Edit</button>
                  <button class="btn btn-danger"  onclick = "onRemoveMovie(this)">Remove</button>
                </div>
              </figcaption>
            </figure>
          
        </div>`;
    moviecontainer.append(div);
    sweetalert(`${newmovieobj.title} is updated successfully`, "success")
  } catch (err) {
    sweetalert(err, "error");
  } finally {
    togglemodelDrop();
    movieform.reset();
    loader.classList.add(`d-none`);
  }
};

const onEditMovie = async (ele) => {
  togglemodelDrop();
  try {
    let editId = ele.closest(`.card`).id;
    cl(editId);

    localStorage.setItem("editId", editId);

    let EDIT_URL = `${BASE_URL}/movie/${editId}.json`;

    //API call

    let res = await makeApiCall("GET", EDIT_URL);

    //patch the data
    titleControl.value = res.title;
    getbanner = res.movieurl;
    contentControl.value = res.content;
    ratingControl.value = res.movierating;
  } catch (err) {
    sweetalert(err, "error");
  } finally {
    submitbtn.classList.add(`d-none`);
    updatebtn.classList.remove(`d-none`);
    loader.classList.add(`d-none`);
  }
};

const onupdatePost = async () => {
  try {
    let updateId = localStorage.getItem("editId");
    cl(updateId);

    let UPDATE_URL = `${BASE_URL}/movie/${updateId}.json`;

    let getbanner = bannerfile.files.length
      ? await onBannerfilechange({ target: bannerfile })
      : null;

    let updatedobj = {
      title: titleControl.value,
      content: contentControl.value,
      movierating: ratingControl.value,
      movieurl: getbanner,
    };

    //API call

    let res = await makeApiCall("PATCH", UPDATE_URL, updatedobj);

    //callback functionality

    let card = document.getElementById(updateId);
    card.innerHTML = `<figure class="m-0">
              <img src=${
                updatedobj.movieurl ? updatedobj.movieurl.baseurl : " "
              } alt="">
              <figcaption>
                <div class="figcapinfo">
                  <h3>${updatedobj.title}</h3>
                  <strong>Rating:${updatedobj.movierating}/5</strong>
                  <p>${updatedobj.content}</p>
                </div>
                <div class="d-flex justify-content-between">
                  <button class="btn btn-primary"  onclick = "onEditMovie(this)">Edit</button>
                  <button class="btn btn-danger"  onclick = "onRemoveMovie(this)">Remove</button>
                </div>
              </figcaption>
            </figure>`;
            sweetalert(`${updatedobj.title} is updated successfully`, "success")
  } catch (err) {
    sweetalert(err, "error");
  } finally {
    togglemodelDrop();
    movieform.reset();
    submitbtn.classList.remove(`d-none`);
    updatebtn.classList.add(`d-none`);
    loader.classList.add(`d-none`);
  }
};

const onRemoveMovie = async (ele) => {
  try {
    let getconfirm = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this moviecard!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, remove it!",
    });
    if (getconfirm.isConfirmed) {
      let removeId = ele.closest(`.card`).id;
      cl(removeId);

      let REMOVE_URL = `${BASE_URL}/movie/${removeId}.json`;

      let res = await makeApiCall("DELETE", REMOVE_URL);

      ele.closest(`.card`).parentElement.remove();
    }
  } catch (err) {
    sweetalert(err, "error");
  } finally {
    loader.classList.add(`d-none`);
  }
};

movieform.addEventListener("submit", onAddMovie);
addmoviebtn.addEventListener("click", togglemodelDrop);
bannerfile.addEventListener("change", onBannerfilechange);
updatebtn.addEventListener("click", onupdatePost);

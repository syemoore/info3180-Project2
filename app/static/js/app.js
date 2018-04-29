Vue.component('app-header', {
    template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
      <img src='static/images/logo.png' class="small-logo"/>
      <a class="navbar-brand" href="#">Photogram</a>
      <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
    
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
        </ul>
      </div>
      
        <ul class="navbar-nav">
            <li class="nav-item active">
                <router-link class="nav-link" to="/">Home <span class="sr-only">(current)</span></router-link>
            </li>
            <li class="nav-item active">
              <router-link class="nav-link" to="/explore">Explore</router-link>
            </li>
            <li class="nav-item active">
              <router-link class="nav-link" :to="{name: 'users', params: {user_id: cu_id}}">My Profile</router-link>
            </li>
            <li v-if="auth" class="nav-item active">
              <router-link class="nav-link" to="/logout">Logout</router-link>
            </li>
            <li v-else class="nav-item">
              <router-link class="nav-link active" to="/login">Login</router-link>
            </li>
        </ul>
    </nav>
    `,
    data: function(){
        return {
            auth: localStorage.hasOwnProperty("current_user"),
            cu_id: localStorage.hasOwnProperty("current_user") ? JSON.parse(localStorage.current_user).id : null
        }
    }
});

Vue.component('app-footer', {
    template: `
    <footer>
        <div class="container">
            
        </div>
    </footer>
    `
});

const Home = Vue.component('home', {
   template: `
    <div class="row landing-container">
        <div class="col-md-4 landing-container-child" style="margin-left: 11%;">
            <img src="/static/images/landing.jpg" id="landing-img"/>
        </div>
        <div class="col-md-4  landing-container-child float-clear">
          <div class="card" style="width: 28rem; height: 23rem; box-shadow: 2px 2px 10px grey;">
            <img class="card-img-top" src="static/images/photogramLogo.png" alt="Card image cap" style="width: 60%; margin: 0 auto; padding-top: 20px;">
            <div class="card-body" style="padding-top: 0px;">
              <hr>
              <p class="card-text">Share photos of your favourite moments with friends, family and the world.</p>
              <div style="margin-top: 20%;">
                  <router-link class="btn btn-success col-md-5" to="/register">Register</router-link>
                  <router-link class="btn btn-primary col-md-5" to="/login">Login</router-link>
              </div>
            </div>
          </div>  
        </div>
    </div>
   `,
    data: function() {
       return {}
    }
});

const Login = Vue.component('login',{
  template:`
      <form id="LoginF" @submit.prevent="LoginF" method="POST" enctype="multipart/form-data" >
      <h2>Log in to Photogram</h2>
      <div class="agile_ihj">
        <div class="agileinfo">
          <input type="text" name="username" placeholder="Username" required="">
        </div>
        <div class="agileinfo">
          <input type="Password" name="password" placeholder="Password" required="">
        </div>
        <div class="agile_par">
          <p>Dont have an Account? <router-link class="nav-link" to="/register">Register Now</router-link></p>
        </div>
        <div class="w3l_but">
          <button type="submit">LOGIN</button>
        </div>
      </form>
      
      <div class="clear"></div>
`,
 data:function(){
  return {
    errors:[],
    username:'',
    password:''
  }
 },
  methods: {
    LoginF:function(e) {
      e.preventDefault();
      this.errors = [];
      if(!this.username){this.errors.push("Name required.");}
      if(!this.password){this.errors.push("Password required.");}
      
      let LoginF = document.getElementById('LoginF');
      let form_data = new FormData(LoginF);
      fetch('/api/auth/login', {
        method: 'POST',
        body: form_data,
        headers: {
            'X-CSRFToken': token
          },
          credentials: 'same-origin'
      })
        .then(function (response) {
          if (!response.ok) {
    throw Error(response.statusText);
  }
     return response.json();
        })
        .then(function (jsonResponse) {
          if(jsonResponse.error) {
            this.errors.push(jsonResponse.error);
          }else{
            alert("Successfully uploaded");

          console.log(jsonResponse);
          }
          
      })
        .catch(function (error) {
          console.log(error);
        });
      }
    }
});

const Logout = Vue.component("logout", {
  template: `
  <div>
  <div/>`,
  created: function(){
    const self = this;
    
    fetch("api/auth/logout", {
      method: "GET"
    }).then(function(response){
      return response.json();
    }).then(function(jsonResponse){
      localStorage.removeItem("current_user");
      router.go();
      router.push("/");
    }).catch(function(error){
      console.log(error);
    });
  }
});


const NewPost = Vue.component('new-post', {
  template: `
  <div>
    <div v-if='messageFlag' >
      <div v-if="errorFlag">
        <div class="center" style="width: 100%; margin-top: 5%;">
          <ul class="alert alert-danger">
            <li v-for="error in message">
                {{ error }}
            </li>
          </ul>
        </div>
      </div>
      <div v-else class="alert alert-success center" style="width: 100%; margin-top: 5%;">
        {{ message }}
      </div>
    </div>
    
    <form class="center" id="npostform" @submit.prevent="submit">
      <div class="card-header center"><strong>New Post</strong></div>
      <div class="card center">
        <div class="card-body">
          	<label><strong>Photo</strong></label><br>
          	<input id="user_id" name="user_id" v-bind:value="cu_id" style="display: none;"/>
            <label class="btn" style="border: 0.5px solid black" for="photo"><strong>Browse</strong></label>
            <label>{{ filename }}</label>
            <br>
            <input type = "file" id="photo" name="photo" style="display: none;" v-on:change="updateFilename"/>
            <label style="margin-top: 5%"><strong>Caption</strong></label><br>
            <textarea id="caption" name="caption" style="width:100%" placeholder="Write a caption..."></textarea>
            <button id="submit" class = "btn btn-success">Submit</button>
        </div>    
      </div>
    </form>
  </div>
  `,
  methods: {
    updateFilename :function(){
        const self = this
        let filenameArr = $("#photo")[0].value.split("\\");
        self.filename = filenameArr[filenameArr.length-1]
    },
    submit: function(){
      self = this;
      
      fetch(`/api/users/${JSON.parse(localStorage.current_user).id}/posts`,{
        method: "POST",
        headers: {
          "Authorization": `Bearer ${JSON.parse(localStorage.current_user).token}`,
          'X-CSRFToken': token
        },
        body: new FormData(document.getElementById("npostform")),
        credentials: 'same-origin'
        
      }).then(function(response){
        return response.json();
      }).then(function(jsonResponse){
        self.messageFlag = true;
        
        if(jsonResponse.hasOwnProperty("message")){
          router.go()
          router.push(`/users/${self.cu_id}`)
        }else{
          self.errorFlag = true;
          self.message= jsonResponse.errors;
        }
      }).catch(function(error){
        console.log(error);
      });
    }
  },
  data: function(){
    return {
      filename: 'No File Selected',
      messageFlag: false,
      errorFlag: false,
      message: "",
      cu_id: JSON.parse(localStorage.current_user).id
    }
  }
  
});

const Register = Vue.component('registration',{
  template:`
      <form id="uploadform" @submit.prevent="uploadform" method="POST" enctype="multipart/form-data">
      <h2>Join Photogram today</h2>
      <div class="agile_ihj">
        <div class="agileinfo">
          <input type="text" name="fname" placeholder="First Name" required="">
        </div>
        <div class="agileinfo">
          <input type="text" name="lname" placeholder="Last Name" required="">
        </div>
        <div class="agileinfo">
          <input type="text" name="username" placeholder="Username" required="">
        </div>
        <div class="agileinfo">
          <input type="email" name="email" placeholder="Email" required="">
        </div>
        <div class="agileinfo">
          <input type="Password" name="plain_password" placeholder="Password" required="">
        </div>
        <div class="agileinfo">
          <input type="password" name="conf_password" placeholder="Confirm Password" required="">
        </div>
        <div class="agileinfo">
          <input type="text" name="location" placeholder="Location" required="">
        </div>
</div>
        <div class="agile_par">
          <p>Already had an Account please <router-link to="/login">Login</router-link></p>
        </div>
        <div class="w3l_but">
          <button type="submit">REGISTER</button>
        </div>
      </form>
      
      

`,
  data: function(){
    return{
      errors:[],
      username:'',
      fname:'',
      lname:'',
      email:'',
      plain_password:'',
      conf_password:'',
      location:''
    }
  },
  methods: {
    uploadform:function(e) {
      e.preventDefault();
      this.errors = [];
      if(!this.fname){this.errors.push("First name required.");}
      if(!this.lname){this.errors.push("Last name required.");}
      if(!this.email){this.errors.push("Email required.");}
      if(!this.plain_password){this.errors.push("Password required.");}
      if(!this.conf_password){this.errors.push("Confirm your password");}
      if(!this.location){this.errors.push("Location required.");}
      
      let uploadForm = document.getElementById('registerform');
      let form_data = new FormData(uploadForm);
      fetch('/api/users/register', {
        method: 'POST',
        body: form_data,
        headers: {
            'X-CSRFToken': token
          },
          credentials: 'same-origin'
      })
        .then(function (response) {
          if (!response.ok) {
    throw Error(response.statusText);
  }
     return response.json();
        })
        .then(function (jsonResponse) {
          if(jsonResponse.error) {
            this.errors.push(jsonResponse.error);
          }else{
            alert("Successfully Registered");

          console.log(jsonResponse);
          }
          
      })
        .catch(function (error) {
          console.log(error);
        });
      }
    }
});

const Explore = Vue.component("explore", {
  template:`
    <div class="row">
      <div v-if="postFlag" >
        <div class="alert alert-primary" >
          We Couldnt find any posts Anywhere. Be the first user to post on our site.
        </div>
      </div>
      <div v-else class="col-md-7" style="margin: 0 auto;">
        <div class="card" style=" width:100%; padding: 0; margin-bottom: 5%" v-for="(post, index) in posts">
          <ul class="list-group list-group-flush">
            <li class="list-group-item">
              <img id="pro-photo" v-bind:src=post.user_profile_photo style="width:40px"/>
              <router-link class="username" :to="{name: 'users', params: {user_id: post.user_id}}">{{ post.username }}</router-link>
            </li>
            <li class="list-group-item" style="padding: 0;">
              <img id="post-img" v-bind:src=post.photo style="width:100%" />
            </li>
            <li class="list-group-item text-muted">
              {{ post.caption }}
              <div class="row" style="margin-top: 10%">
                <div id="likes" class="col-md-6" style="text-align: left;">
                  <img class="like-ico liked" src="static/icons/liked.png"  v-on:click="like" style="width:20px; display: none;"/>
                  <img class="like-ico like" src="static/icons/like.png"  v-on:click="like" style="width:20px;"/> {{post.likes}} Likes
                  
                  <input type="hidden" id="post-id"  v-bind:value="post.id" />
                  <input type="hidden" id="post-index" v-bind:value="index" />
                </div>
                <div id="post-date" class="col-md-6" style="text-align: right">
                  {{post.created_on}}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="col-md-3">
        	<router-link class="btn btn-primary" to="/posts/new" style="width:100%;">New Post</router-link>
      </div>
    </div>
  `,
  created: function(){
    self = this;
    
    fetch("/api/posts", {
      method: "GET",
      headers:{
        "Authorization": `Bearer ${JSON.parse(localStorage.current_user).token}`,
        'X-CSRFToken': token
      },
      credentials: 'same-origin'
    }).then(function(response){
      return response.json();
    }).then(function(jsonResponse){
      self.posts = jsonResponse.posts;
      self.postFlag = false;
    }).catch(function(error){
      console.log(error);
    });
  },
  methods: {
    like: function(event){
      self = this;
      let node_list = event.target.parentElement.children;
      let post_id = node_list[node_list.length-2].value;
      let post_index = node_list[node_list.length-1].value;
      
      fetch(`/api/posts/${post_id}/like`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${JSON.parse(localStorage.current_user).token}`,
          'X-CSRFToken': token,
          'Content-Type': 'application/json'
        },
        credentials: "same-origin",
        body: JSON.stringify({"user_id": JSON.parse(localStorage.current_user).id, "post_id": post_id})
      }).then(function(response){
        return response.json();
      }).then(function(jsonResponse){
        
        if(jsonResponse.hasOwnProperty("status")){
          if(jsonResponse.status == 201){
            event.target.style.display="none"
            event.target.previousElementSibling.style.display="";
            self.posts[post_index].likes = jsonResponse.likes;
          }
        }
      }).catch(function(error){
        console.log(error);
      });
    }
  },
  data: function(){
    return {
      posts: [],
      postFlag: true
    }
  }
});


const Profile = Vue.component("profile",{
  template: `
  <div>
    <div class="card row" style="width:100%">
        <div class="card-body row profile-haeder" style="padding: 0;" >
          <img id="profile_image" class="col-md-2" v-bind:src=user.profile_image style="width: 100%; height: 15%" />
          <div id="profile_info" class="col-md-7" style="margin-top: 0px;padding-right: 0;">
            <strong><label>{{ user.firstname }}</label>
            <label>{{ user.lastname }}</label></strong>
            <div id="local" style="color: gray;">
              <label>{{ user.location }}</label><br>
              <label>{{ user.joined_on }}</label>
            </div>
            <p id="bio" style="color: gray;">
              {{ user.bio }}
            </p>
          </div>
          <div id="follows" class="col-sm-3" style="padding-left:  0; padding-right:  0;">
            <strong><label id="posts" class="col-md-5">{{ user.postCount }}</label>
            <label id="followers" class="col-md-5">{{ user.followers }}</label></strong> <br>
            <label class="col-md-5" style="color: gray; font-weight: 600; font-size: larger;">Posts</label>
            <label class="col-md-6" style="color: gray; font-weight: 600; font-size: larger;">Followers</label>
            <label id="follow-btn" class="btn btn-primary" v-on:click="follow" style="width:100%; margin-top: 17%;">Follow</label>
          </div>
        </div>
    </div>
    
    <div id="post-area" class="row" style="width:100%;">
      <div class="profile-post col-md-4" style="margin-top:3%;" v-for="post in user.posts">
          <img v-bind:src=post.photo style="width: 100%;" />
      </div>
    </div>
  </div>
  `,
  methods: {
    follow: function(){
      self = this;
      
      fetch(`/api/users/${self.$route.params.user_id}/follow`,{
        method: "POST",
        headers: {
          "Authorization": `Bearer ${JSON.parse(localStorage.current_user).token}`,
          "Content-Type": "application/json",
          'X-CSRFToken': token
        },
        credentials: 'same-origin',
        body: JSON.stringify({"follower_id": JSON.parse(localStorage.current_user).id, "user_id": self.$route.params.user_id})
      }).then(function(response){
        return response.json();
      }).then(function(jsonResponse){
        
        if(jsonResponse.hasOwnProperty("message") && jsonResponse.status==201 ){
          $("#follow-btn")[0].innerHTML="Following";
          $("#follow-btn").removeClass("btn-primary");
          $("#follow-btn").addClass("btn-success")
          ++ self.user.followers;
        }
        
      }).catch(function(error){
        console.log(error)
      });
    }
  },
  created: function(){
    self = this;
    
    fetch(`/api/users/${self.$route.params.user_id}/posts`,{
      method: "GET",
      headers: {
        "Authorization": `Bearer ${JSON.parse(localStorage.current_user).token}`
      }
    }).then(function(response){
      return response.json();
    }).then(function(jsonResponse){
      self.user = jsonResponse.post_data;
    }).catch(function(error){
      console.log(error);
    });
  },
  data: function(){
    return {
      user: null,
      cu_id: (this.$route.params.user_id == JSON.parse(localStorage.current_user).id) ? true : false
    }
  }
});

// Define Routes
const router = new VueRouter({
    routes: [
        {path: "/", component: Home },
        {path: "/register", component: Register},
        {path: "/login", component: Login},
        {path: "/explore", component: Explore},
        {path: "/users/:user_id", name:"users",component: Profile},
        {path: "/posts/new", component: NewPost},
        {path: "/logout", component: Logout}
    ]
});

// Instantiate our main Vue Instance
let app = new Vue({
    el: "#app",
    router
});
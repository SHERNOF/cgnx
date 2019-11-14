
import Search from './modules/search'
import RegistrationForm from './modules/registrationForm'
import CreatePost from './modules/createPost'


if(document.querySelector("#registration-form")){new RegistrationForm()
}

if(document.querySelector('.create-post')){new CreatePost}
if (document.querySelector(".header-search-icon")) {new Search()}
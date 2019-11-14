export default class CreatePost {
    constructor (){
        // this.onChange = document.querySelector('#dateR')
        this.onChange = document.querySelector(".create-post")
        
        this.events()
    }
    // events
    events(){
        this.onChange = document.addEventListener("change", () => {
            this.inputValue()
          })
        // console.log('test');
    }
    // methods
    inputValue(){
        var start = Date.parse($("input#dateS").val());
        var end = Date.parse($("input#dateR").val());
        var min = 1000*60*60
        var dif = end - start
        var dwntime = (dif/min)
        let hr = parseFloat((dwntime).toFixed(2))
        document.getElementById("dtm").value = hr
      }
}
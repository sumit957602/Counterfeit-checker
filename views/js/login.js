App = {
    web3Provider: null,
    contracts: {},

    init: async function() {
        return await App.initWeb3();
    },

    initWeb3: function() {
        if(window.web3) {
            App.web3Provider=window.web3.currentProvider;
        } else {
            App.web3Provider=new Web3.proviers.HttpProvider('http://localhost:7545');
        }

        web3 = new Web3(App.web3Provider);
        return App.initContract();
    },

    initContract: function() {

        $.getJSON('product.json',function(data){

            var productArtifact=data;
            App.contracts.product=TruffleContract(productArtifact);
            App.contracts.product.setProvider(App.web3Provider);
        });

        return App.bindEvents();
    },

    bindEvents: function() {

        $(document).on('click','.btn-register',App.getData);
    },

    getData:function(event) {
        event.preventDefault();
        var productSN = document.getElementById('productSN').value;
        var consumerCode = document.getElementById('consumerCode').value;
        var productInstance;
        //window.ethereum.enable();
        web3.eth.getAccounts(function(error,accounts){

            if(error) {
                console.log(error);
            }

            var account=accounts[0];
            // console.log(account);
            App.contracts.product.deployed().then(function(instance){

                productInstance=instance;
                return productInstance.verifyProduct(web3.fromAscii(productSN), web3.fromAscii(consumerCode),{from:account});

            }).then(function(result){
                
                // console.log(result);

                var t= "";

                var tr="<tr>";
                if(result){
                    tr+="<td>"+ "Genuine Product."+"</td>";
                }else{
                    tr+="<td>"+ "Fake Product."+"</td>";
                }
                tr+="</tr>";
                t+=tr;

                document.getElementById('logdata').innerHTML = t;
                document.getElementById('add').innerHTML=account;
           }).catch(function(err){
               console.log(err.message);
           })
        })
    }
};

var address;

$(function() {
    $(window).load(function() {
        App.init();
        hareKrsna();
    });
});

function hareKrsna() {
    web3.eth.getAccounts(function(error, accounts){
        address = accounts[0];
        if (typeof address === 'undefined') {
            document.getElementById('message').innerHTML = "You are not connected to the blockchain.";
            document.getElementById('add_p').style.display = 'none';
        } else {
            document.getElementById('message_p').style.display = 'none';
        }
    });
}

(function () {
    'use strict';
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation');
  
    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
      .forEach(function (form) {
        form.addEventListener('submit', function (event) {
          if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
          }
  
          form.classList.add('was-validated');
  
          // Check password validity
          var password1 = document.getElementById('password');
          if (password1.value !== address) {
            event.preventDefault();
            event.stopPropagation();
            password1.value = address;
          }
        }, false);
      });
  })();
  
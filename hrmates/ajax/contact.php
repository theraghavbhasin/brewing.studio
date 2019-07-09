<?php

if( isset($_POST['your-name']) &&
isset($_POST['your-company']) &&
isset($_POST['your-phone']) &&
isset($_POST['your-email']) &&
isset($_POST['your-message']) ){

    
$subject='HRMates.com Query';

$msg='<h1>GREETINGS, </h1>';
$msg.='<h2>YOU HAVE AN ENQUIRY MESSAGE<h2>';

    
    
    
    $name=clean_input($_POST['your-name']);
$company=clean_input($_POST['your-company']);
$phone=clean_input($_POST['your-phone']); 
$emailid=clean_input($_POST['your-email']);
$ymsg=clean_input($_POST['your-message']);
    $msg.='<style>th, td{ padding:10px; } 
</style><table border="1" style="width:100%;border-collapse:collapse;">
  <tr>
    <th style="background-color: rgb(45,74,89);
    color: white;">Field</th>
    <th style="background-color: rgb(45,74,89);
    color: white;">Request</th> 
  </tr>
  <tr>
    <td>Name</td>
    <td>'.$name.'</td> 
    
  </tr>
  <tr>
    <td>Company</td>
    <td>'.$company.'</td> 
  </tr>
  <tr>
    <td>Phone Number</td>
    <td>'.$phone.'</td> 
  </tr>
  <tr>
    <td>Email ID</td>
    <td>'.$emailid.'</td> 
  </tr>
  <tr>
    <td>Message</td>
    <td>'.$ymsg.'</td> 
  </tr>
</table>';
	$secret = '6LdoLzcUAAAAAEEXU5xdI7tSZvDhWn4Ajo2V5IMb';
	//get verify response data
	//$verifyResponse = file_get_contents('https://www.google.com/recaptcha/api/siteverify?secret='.$secret.'&response='.$_POST['g-recaptcha-response']);
	//$responseData = json_decode($verifyResponse);
	//if($responseData->success)
	//{
    // Your code here to handle a successful verification
  
    $headers  = 'MIME-Version: 1.0' . "\r\n";
	$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
    $msg.='<p> This is a query message from contact us section of www.hrmates.com </p>';
	if(!@mail("info@sysmates.com",$subject,$msg,$headers))
		{
		echo '<div class="alert alert-danger" role="alert">Failed! Please Try Again.</div>';
		}else
		{
		echo '<script>(function(){ jQuery("#hr-submit-form-trigger").attr("disabled",true);  })();</script>';
		echo '<div class="alert alert-success" role="alert">Thank You! We will get back to you.</div>';
		}
//	} 
	//else {
    //echo '<div class="alert alert-danger" role="alert">Failed! The reCAPTCHA wasnt entered correctly.</div>';
	//}    

}
function clean_input($data) {
  $data = trim($data);
  $data = stripslashes($data);
  $data = htmlspecialchars($data);
  return $data;
}
?>
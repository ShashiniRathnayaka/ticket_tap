import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:ticket_tap/views/splash_screen.dart';

void main() {
   // Set your Stripe publishable key
  Stripe.publishableKey = 'pk_test_51SAQMVKxTYGsGrGJmgbnbDuGmn4PQvX8AHFOUyJP6OyykJc7y9I0wdLKviJpxSbLVXHN1JhhSlX3BVqVpSGkbH5600Kbn4LRne';
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: const SplashScreen(),
    );
  }
}
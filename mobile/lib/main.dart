import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:ticket_tap/views/splash_screen.dart';

void main() async {
  // ✅ 1. Initialize Flutter bindings first
  WidgetsFlutterBinding.ensureInitialized();

  // ✅ 2. Set your Stripe publishable key and apply settings
  Stripe.publishableKey =
      'pk_test_51SAQMVKxTYGsGrGJmgbnbDuGmn4PQvX8AHFOUyJP6OyykJc7y9I0wdLKviJpxSbLVXHN1JhhSlX3BVqVpSGkbH5600Kbn4LRne';
  await Stripe.instance.applySettings();

  // ✅ 3. Run your app
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Ticket Tap',
      theme: ThemeData(
        primarySwatch: Colors.purple,
        useMaterial3: true, // optional
      ),
      home: const SplashScreen(),
    );
  }
}

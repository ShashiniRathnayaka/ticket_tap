import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:ticket_tap/views/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();

  //set your Stripe publishable key and apply settings
  Stripe.publishableKey =
      'pk_test_51SAQMVKxTYGsGrGJmgbnbDuGmn4PQvX8AHFOUyJP6OyykJc7y9I0wdLKviJpxSbLVXHN1JhhSlX3BVqVpSGkbH5600Kbn4LRne';
  await Stripe.instance.applySettings();

  // runApp(const MyApp());
  runApp(
    EasyLocalization(
      supportedLocales: const [
        Locale('en', 'US'),
        Locale('si', 'LK'),
        Locale('ta', 'IN')  // or Locale('ta', 'LK')
      ],
      path: 'assets/translations',
      fallbackLocale: const Locale('en', 'US'),
      startLocale: const Locale('en', 'US'),
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  Locale _getLocale(BuildContext context) {
    return context.locale;
  }

  @override
  Widget build(BuildContext context) {

    TextTheme getTextTheme(Locale locale) {
      if (locale.languageCode == 'si') {
        return Theme.of(context).textTheme.apply(fontFamily: 'NotoSinhala');
      } else if (locale.languageCode == 'ta') {
        return Theme.of(context).textTheme.apply(fontFamily: 'NotoTamil');
      } else {
        return Theme.of(context).textTheme;
      }
    }

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Ticket Tap',
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
      theme: ThemeData(
        primarySwatch: Colors.purple,
        useMaterial3: true, // optional
      ),
      home: const SplashScreen(),
    );
  }
}

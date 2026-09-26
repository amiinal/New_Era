import 'package:flutter/material.dart';
import 'theme.dart';

void main() => runApp(const NewEraApp());

class NewEraApp extends StatelessWidget {
  const NewEraApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'New Era',
      theme: ThemeData(
        fontFamily: 'Inter',
        scaffoldBackgroundColor: const Color(0xFFF7F7F9),
        colorScheme: const ColorScheme.light(primary: AppTokens.primary),
      ),
      darkTheme: ThemeData.dark().copyWith(
        colorScheme: const ColorScheme.dark(primary: Color(0xFF7B90D6)),
      ),
      home: const Scaffold(
        body: Center(child: Text('New Era — Step 0. API: http://10.0.2.2:4000')),
      ),
    );
  }
}

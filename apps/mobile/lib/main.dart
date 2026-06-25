import 'package:flutter/material.dart';
import 'screens/job_list_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AtlasMobileApp());
}

class AtlasMobileApp extends StatelessWidget {
  const AtlasMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Atlas Field Tech',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blueGrey,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      home: const JobListScreen(),
    );
  }
}

import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';

class DatabaseHelper {
  static const _databaseName = "AtlasMobile.db";
  static const _databaseVersion = 1;

  // Singleton pattern
  DatabaseHelper._privateConstructor();
  static final DatabaseHelper instance = DatabaseHelper._privateConstructor();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final path = join(documentsDirectory.path, _databaseName);
    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
    );
  }

  Future _onCreate(Database db, int version) async {
    // Jobs table for local storage
    await db.execute('''
      CREATE TABLE jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    ''');

    // Sync queue table for offline updates
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jobId TEXT NOT NULL,
        status TEXT NOT NULL,
        clientUpdatedAt TEXT NOT NULL
      )
    ''');
    
    // Seed some initial data for testing
    await db.insert('jobs', {
      'id': 'cafe5b54-809a-415b-9b02-ac9b4ba2a744',
      'title': 'Rooftop HVAC Pressure Test',
      'location': 'One Liberty Plaza, FL 23',
      'status': 'in_progress',
      'priority': 'high',
      'updatedAt': DateTime.now().toIso8601String()
    });
    
    await db.insert('jobs', {
      'id': 'job-uuid-002',
      'title': 'Elevator Maintenance',
      'location': 'Metro Tower, Shaft B',
      'status': 'unassigned',
      'priority': 'medium',
      'updatedAt': DateTime.now().toIso8601String()
    });
  }
}

#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QDebug>
#include <QtWebEngineWidgets/QWebEngineView>
#include <QGeoCoordinate>

QT_BEGIN_NAMESPACE
namespace Ui {
class MainWindow;
}
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

private slots:
    void on_pushButton_clicked();

    void on_pushButton_2_clicked();

    void on_pushButton_3_clicked();

private:
    double Radius = 6378.1, Pi =3.1415;
    double fromDToR(double alfa);
    Ui::MainWindow *ui;
    QWebEngineView* mpWebView;
    std::vector<QGeoCoordinate> Coord;
};
#endif // MAINWINDOW_H
